/**
 * HTTP route registrar. Validates bodies with the shared zod command schemas,
 * delegates to the application layer, and maps results/errors onto the wire.
 * Auth/role resolution lives in `auth.ts` / `membership.ts`; status mapping in
 * `errors.ts`. This file just wires the three together per-route.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  CreateCampaignSchema,
  CreateCharacterSchema,
  CreateMapSchema,
  LevelUpCharacterSchema,
  LoginSchema,
  RegisterSchema,
  UpdateCharacterSchema,
  UpdateMapSchema,
} from '@grimorio/shared/commands';
import { registerUser, login } from '../../application/auth/index.js';
import {
  createCampaign,
  deleteCampaign,
  issueInvite,
  joinByCode,
  listCampaignsForUser,
} from '../../application/campaign/index.js';
import {
  createMap,
  deleteMap,
  getMap,
  listMaps,
  updateMap,
} from '../../application/maps/index.js';
import {
  createCharacter,
  updateCharacter,
  levelUpCharacter,
  getCharacter,
} from '../../application/character/index.js';
import { getOrCreateLiveTable } from '../../application/livetable/index.js';
import { projectLiveTable } from '../../domain/visibility/index.js';
import type { CampaignId, CharacterId, MapId, UserId } from '../../domain/ids.js';
import type { HttpDeps } from './index.js';
import { clearSessionCookie, requireSession, setSessionCookie } from './auth.js';
import { signSession } from '../auth/session.js';
import { bodyForError, statusForError, NotCampaignMemberError } from './errors.js';
import { resolveRole } from './membership.js';

/** Parse `req.body` with `schema`; on failure send 400 and return undefined. */
function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
  reply: FastifyReply,
): z.infer<T> | undefined {
  const result = schema.safeParse(body);
  if (!result.success) {
    reply.code(400).send({ error: 'BadRequest', message: result.error.message });
    return undefined;
  }
  return result.data;
}

function handleError(err: unknown, reply: FastifyReply): void {
  reply.code(statusForError(err)).send(bodyForError(err));
}

/**
 * Inject the command discriminator the zod schemas require. REST clients send
 * only the data fields (the route path already implies the command), so the
 * server stamps the correct `type` before validating. Idempotent when a client
 * already sent it.
 */
function withType(body: unknown, type: string): unknown {
  return { ...(typeof body === 'object' && body !== null ? body : {}), type };
}

export function registerHttpRoutes(app: FastifyInstance, deps: HttpDeps): void {
  const auth = requireSession(deps.config);

  app.setErrorHandler((err, _req, reply) => {
    handleError(err, reply);
  });

  // ---------- Auth ----------

  app.post('/auth/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const cmd = parseBody(RegisterSchema, withType(req.body, 'Register'), reply);
    if (!cmd) return;
    try {
      const principal = await registerUser(
        { email: cmd.email, password: cmd.password, displayName: cmd.displayName },
        deps,
      );
      const token = signSession(principal, deps.config.sessionSecret);
      setSessionCookie(reply, principal, deps.config);
      reply.send({ ...principal, token });
    } catch (err) {
      handleError(err, reply);
    }
  });

  app.post('/auth/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const cmd = parseBody(LoginSchema, withType(req.body, 'Login'), reply);
    if (!cmd) return;
    try {
      const principal = await login({ email: cmd.email, password: cmd.password }, deps);
      const token = signSession(principal, deps.config.sessionSecret);
      setSessionCookie(reply, principal, deps.config);
      reply.send({ ...principal, token });
    } catch (err) {
      handleError(err, reply);
    }
  });

  app.post('/auth/logout', async (_req: FastifyRequest, reply: FastifyReply) => {
    clearSessionCookie(reply, deps.config);
    reply.code(204).send();
  });

  // Who am I? Lets the SPA restore the session on load (the cookie is httpOnly,
  // so the client can't read the principal directly). 401 when not logged in.
  app.get(
    '/auth/me',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      reply.send(req.principal);
    },
  );

  // ---------- Campaigns ----------

  app.get(
    '/campaigns',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const campaigns = await listCampaignsForUser(req.principal!.userId as UserId, deps);
        reply.send(campaigns);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.post(
    '/campaigns',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const cmd = parseBody(CreateCampaignSchema, withType(req.body, 'CreateCampaign'), reply);
      if (!cmd) return;
      try {
        const campaign = await createCampaign(
          { ownerId: req.principal!.userId as UserId, name: cmd.name, tagline: cmd.tagline },
          deps,
        );
        reply.send(campaign);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.delete(
    '/campaigns/:id',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      try {
        await deleteCampaign(
          { campaignId: id as CampaignId, actorId: req.principal!.userId as UserId },
          deps,
        );
        reply.code(204).send();
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.post(
    '/campaigns/:id/invite',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // The campaign id comes from the URL param (authoritative); no body needed.
      const { id } = req.params as { id: string };
      try {
        const campaign = await issueInvite(
          { campaignId: id as CampaignId, actorId: req.principal!.userId as UserId },
          deps,
        );
        reply.send(campaign);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.post(
    '/join/:code',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // The join code comes from the URL param (authoritative); no body needed.
      const { code } = req.params as { code: string };
      try {
        const campaign = await joinByCode(
          { joinCode: code, userId: req.principal!.userId as UserId },
          deps,
        );
        reply.send(campaign);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.get(
    '/campaigns/:id/characters',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      try {
        const campaign = await deps.campaigns.findById(id as CampaignId);
        if (!campaign) {
          reply.code(404).send({ error: 'NotFound', message: 'Campaign not found' });
          return;
        }
        if (!resolveRole(campaign, req.principal!.userId as UserId)) {
          throw new NotCampaignMemberError();
        }
        reply.send(await deps.characters.listByCampaign(id as CampaignId));
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  // ---------- Characters ----------

  app.post(
    '/characters',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const cmd = parseBody(CreateCharacterSchema, withType(req.body, 'CreateCharacter'), reply);
      if (!cmd) return;
      try {
        const character = await createCharacter(
          {
            campaignId: cmd.campaignId as CampaignId,
            ownerId: req.principal!.userId as UserId,
            name: cmd.name,
            species: cmd.species,
            className: cmd.className,
            background: cmd.background,
            level: cmd.level,
            method: cmd.method,
            scores: cmd.scores,
            proficientSkills: cmd.proficientSkills,
            spells: cmd.spells,
          },
          deps,
        );
        reply.send(character);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.patch(
    '/characters/:id',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // REST: the request body IS the patch; characterId comes from the URL.
      const { id } = req.params as { id: string };
      const cmd = parseBody(
        UpdateCharacterSchema,
        withType({ characterId: id, patch: req.body ?? {} }, 'UpdateCharacter'),
        reply,
      );
      if (!cmd) return;
      try {
        const character = await updateCharacter(
          {
            characterId: id as CharacterId,
            actorId: req.principal!.userId as UserId,
            patch: cmd.patch,
          },
          deps,
        );
        reply.send(character);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.post(
    '/characters/:id/levelup',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
      const cmd = parseBody(
        LevelUpCharacterSchema,
        withType({ characterId: id, ...body }, 'LevelUpCharacter'),
        reply,
      );
      if (!cmd) return;
      try {
        const result = await levelUpCharacter(
          {
            characterId: id as CharacterId,
            actorId: req.principal!.userId as UserId,
            hpMethod: cmd.hpMethod,
            asi: cmd.asi,
          },
          deps,
        );
        reply.send(result);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.get(
    '/characters/:id',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      try {
        const character = await getCharacter(
          { characterId: id as CharacterId, actorId: req.principal!.userId as UserId },
          deps,
        );
        reply.send(character);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  // ---------- SRD (curated bestiary) ----------

  app.get(
    '/srd/monsters',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { q } = req.query as { q?: string };
      reply.send(deps.srd.searchMonsters(q ?? ''));
    },
  );

  app.get(
    '/srd/monsters/:id',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const monster = deps.srd.getMonster(id);
      if (!monster) {
        reply.code(404).send({ error: 'NotFound', message: `Monster not found: ${id}` });
        return;
      }
      reply.send(monster);
    },
  );

  app.get('/srd/species', { preHandler: auth }, async (_req, reply) => {
    reply.send(deps.srd.species());
  });

  app.get('/srd/classes', { preHandler: auth }, async (_req, reply) => {
    reply.send(deps.srd.classes());
  });

  app.get('/srd/backgrounds', { preHandler: auth }, async (_req, reply) => {
    reply.send(deps.srd.backgrounds());
  });

  app.get(
    '/srd/spells',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { class: classId } = req.query as { class?: string };
      reply.send(deps.srd.spells(classId));
    },
  );

  app.get('/srd/weapons', { preHandler: auth }, async (_req, reply) => {
    reply.send(deps.srd.weapons());
  });

  // ---------- Maps ----------

  app.get(
    '/campaigns/:id/maps',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      try {
        const maps = await listMaps(
          { campaignId: id as CampaignId, actorId: req.principal!.userId as UserId },
          deps,
        );
        reply.send(maps);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.post(
    '/campaigns/:id/maps',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const cmd = parseBody(
        CreateMapSchema,
        withType({ ...((req.body ?? {}) as object), campaignId: id }, 'CreateMap'),
        reply,
      );
      if (!cmd) return;
      try {
        const map = await createMap(
          {
            campaignId: id as CampaignId,
            actorId: req.principal!.userId as UserId,
            name: cmd.name,
            type: cmd.mapType,
            environment: cmd.environment,
            width: cmd.width,
            height: cmd.height,
            gridSize: cmd.gridSize,
          },
          deps,
        );
        reply.send(map);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.get(
    '/campaigns/:id/maps/:mapId',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { mapId } = req.params as { mapId: string };
      try {
        const map = await getMap(
          { mapId: mapId as MapId, actorId: req.principal!.userId as UserId },
          deps,
        );
        reply.send(map);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.patch(
    '/campaigns/:id/maps/:mapId',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { mapId } = req.params as { mapId: string };
      // REST: body IS the patch; mapId from URL.
      const cmd = parseBody(
        UpdateMapSchema,
        withType({ ...((req.body ?? {}) as object), mapId }, 'UpdateMap'),
        reply,
      );
      if (!cmd) return;
      try {
        const map = await updateMap(
          {
            mapId: mapId as MapId,
            actorId: req.principal!.userId as UserId,
            name: cmd.name,
            type: cmd.mapType,
            environment: cmd.environment,
            width: cmd.width,
            height: cmd.height,
            gridSize: cmd.gridSize,
            layers: cmd.layers,
          },
          deps,
        );
        reply.send(map);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  app.delete(
    '/campaigns/:id/maps/:mapId',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { mapId } = req.params as { mapId: string };
      try {
        await deleteMap(
          { mapId: mapId as MapId, actorId: req.principal!.userId as UserId },
          deps,
        );
        reply.code(204).send();
      } catch (err) {
        handleError(err, reply);
      }
    },
  );

  // ---------- Live table snapshot ----------

  app.get(
    '/tables/:campaignId/snapshot',
    { preHandler: auth },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { campaignId } = req.params as { campaignId: string };
      try {
        const campaign = await deps.campaigns.findById(campaignId as CampaignId);
        if (!campaign) {
          reply.code(404).send({ error: 'NotFound', message: `Campaign not found: ${campaignId}` });
          return;
        }

        const role = resolveRole(campaign, req.principal!.userId as UserId);
        if (!role) {
          throw new NotCampaignMemberError();
        }

        const table = await getOrCreateLiveTable(campaign.id, deps.tables);
        const snapshot = projectLiveTable(table, {
          userId: req.principal!.userId as UserId,
          role,
        });
        reply.send(snapshot);
      } catch (err) {
        handleError(err, reply);
      }
    },
  );
}
