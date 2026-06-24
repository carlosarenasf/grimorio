/**
 * App shell — minimal state-driven navigation (no router dependency).
 *
 * Flow: Registro → Campañas → (per campaign) Crear personaje / Mesa en vivo.
 * The live table connects a LiveConnection and renders the master or player
 * view based on the server-projected snapshot's `viewerRole`.
 *
 * The player view loads its full owned sheet via GET /characters/:id (the
 * snapshot carries only public combat data + the viewer's `ownCharacterId`),
 * mapping it to the `YouCharacter` the screen needs.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createApiClient, createLiveConnection, createSessionStore } from './net/index.js';
import type { Snapshot } from '@grimorio/shared/wire';
import type { Command } from '@grimorio/shared/commands';
import { RegistroScreen } from './screens/Registro/index.js';
import { LoginScreen } from './screens/Login/index.js';
import { CampanasScreen } from './screens/Campanas/index.js';
import './app.css';
import { CrearPersonajeScreen } from './screens/CrearPersonaje/index.js';
import { VistaMasterScreen } from './screens/VistaMaster/index.js';
import type { MonsterSummary, SrdSource } from './screens/VistaMaster/index.js';
import { VistaJugadorScreen } from './screens/VistaJugador/index.js';
import type { YouCharacter } from './screens/VistaJugador/index.js';
import type { CharacterDTO } from './net/http.js';
import { Button } from './design/index.js';

const abilityMod = (score: number) => Math.floor((score - 10) / 2);
const profBonus = (level: number) => Math.ceil(level / 4) + 1;

/** Map the server's character sheet to the player screen's YouCharacter. */
function toYouCharacter(sheet: CharacterDTO, combatantId: string | null): YouCharacter {
  return {
    combatantId,
    characterId: sheet.id,
    name: sheet.name,
    scores: sheet.scores,
    maxHp: sheet.maxHp,
    currentHp: sheet.currentHp,
    armorClass: sheet.armorClass,
    speed: sheet.speed,
    proficiencyBonus: profBonus(sheet.level),
    initiative: abilityMod(sheet.scores.dex),
    attacks: (sheet.attacks ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      bonus: a.bonus,
      damage: a.damage,
    })),
    inventory: sheet.inventory ?? [],
    gold: sheet.gold,
  };
}

type Principal = { userId: string; displayName: string };
type View =
  | { name: 'loading' }
  | { name: 'auth' }
  | { name: 'campaigns' }
  | { name: 'character'; campaignId: string }
  | { name: 'table'; campaignId: string };

/** Read an invite code from the URL: /unirse/CODE, /join/CODE, or ?join=CODE. */
function parsePendingJoinCode(): string | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(/^\/(?:unirse|join)\/([^/?#]+)/);
  if (m) return decodeURIComponent(m[1]);
  return new URLSearchParams(window.location.search).get('join');
}

function clearJoinUrl(): void {
  if (typeof window !== 'undefined' && window.history?.replaceState) {
    window.history.replaceState(null, '', '/');
  }
}

export function App() {
  const api = useMemo(() => createApiClient({}), []);
  const session = useMemo(() => createSessionStore(), []);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [view, setView] = useState<View>({ name: 'loading' });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const pendingJoin = useRef<string | null>(parsePendingJoinCode());

  const joinAndEnter = useCallback(
    async (code: string) => {
      try {
        const camp = await api.joinByCode(code);
        setView({ name: 'table', campaignId: camp.id });
      } catch {
        // Unknown/invalid code — drop into the campaigns hub instead of a dead end.
        setView({ name: 'campaigns' });
      } finally {
        pendingJoin.current = null;
        clearJoinUrl();
      }
    },
    [api],
  );

  // Restore the session on load: the cookie is httpOnly, so ask the server who
  // we are. If logged in, honour a pending invite link; otherwise show auth.
  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((p) => {
        if (cancelled) return;
        session.setPrincipal(p);
        setPrincipal(p);
        if (pendingJoin.current) void joinAndEnter(pendingJoin.current);
        else setView({ name: 'campaigns' });
      })
      .catch(() => {
        if (!cancelled) setView({ name: 'auth' });
      });
    return () => {
      cancelled = true;
    };
  }, [api, session, joinAndEnter]);

  function afterAuth() {
    setPrincipal(session.get());
    if (pendingJoin.current) void joinAndEnter(pendingJoin.current);
    else setView({ name: 'campaigns' });
  }

  if (view.name === 'loading') {
    return (
      <main className="gx-loading" role="status" aria-live="polite">
        <p>Cargando…</p>
      </main>
    );
  }

  if (view.name === 'auth' || !principal) {
    const banner = pendingJoin.current ? (
      <div className="gx-join-banner" role="status">
        Inicia sesión o crea una cuenta para unirte a la campaña.
      </div>
    ) : null;
    const screen =
      authMode === 'login' ? (
        <LoginScreen
          api={api}
          session={session}
          onLoggedIn={afterAuth}
          onGoToRegister={() => setAuthMode('register')}
        />
      ) : (
        <RegistroScreen
          api={api}
          session={session}
          onRegistered={afterAuth}
          onGoToLogin={() => setAuthMode('login')}
        />
      );
    return (
      <>
        {banner}
        {screen}
      </>
    );
  }

  if (view.name === 'campaigns') {
    return (
      <CampanasScreen
        api={api}
        principal={principal}
        onEnter={(campaignId) => setView({ name: 'table', campaignId })}
        onJoinByCode={(code) => void joinAndEnter(code)}
      />
    );
  }

  if (view.name === 'character') {
    return (
      <CrearPersonajeScreen
        api={api}
        campaignId={view.campaignId}
        ownerId={principal.userId}
        onBack={() => setView({ name: 'campaigns' })}
        onSaved={() => setView({ name: 'table', campaignId: view.campaignId })}
      />
    );
  }

  return (
    <TableView
      api={api}
      campaignId={view.campaignId}
      onLeave={() => setView({ name: 'campaigns' })}
      onCreateCharacter={() => setView({ name: 'character', campaignId: view.campaignId })}
    />
  );
}

function TableView(props: {
  api: ReturnType<typeof createApiClient>;
  campaignId: string;
  onLeave: () => void;
  onCreateCharacter: () => void;
}) {
  const { api, campaignId } = props;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [you, setYou] = useState<YouCharacter | null>(null);
  const [monsters, setMonsters] = useState<MonsterSummary[]>([]);
  const connection = useMemo(() => createLiveConnection({ campaignId }), [campaignId]);

  // Load the curated SRD bestiary from the backend (real ids → AddCombatantFromBestiary works).
  const isDm = snapshot?.viewerRole === 'dm';
  useEffect(() => {
    if (!isDm || monsters.length > 0) return;
    let cancelled = false;
    api
      .searchMonsters('')
      .then((list) => {
        if (!cancelled) {
          setMonsters(list.map((m) => ({ id: m.id, name: m.name, kind: m.meta, cr: m.cr })));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isDm, api, monsters.length]);

  const srd: SrdSource = useMemo(
    () => ({
      searchMonsters: (q: string) => {
        const ql = q.toLowerCase().trim();
        return ql ? monsters.filter((m) => m.name.toLowerCase().includes(ql)) : monsters;
      },
    }),
    [monsters],
  );

  useEffect(() => {
    const off = connection.onSnapshot((s) => setSnapshot(s));
    connection.connect();
    return () => {
      off();
      connection.close();
    };
  }, [connection]);

  // When playing, load the full owned sheet for the action economy / TU FICHA.
  const ownCharacterId = snapshot?.viewerRole === 'player' ? snapshot.ownCharacterId : null;
  useEffect(() => {
    if (!ownCharacterId) {
      setYou(null);
      return;
    }
    let cancelled = false;
    const combatantId =
      snapshot && snapshot.viewerRole === 'player'
        ? (snapshot.combatants.find((c) => c.type === 'pc')?.id ?? null)
        : null;
    api
      .getCharacter(ownCharacterId)
      .then((sheet) => {
        if (!cancelled) setYou(toYouCharacter(sheet, combatantId));
      })
      .catch(() => {
        /* leave `you` null; the player view shows a waiting state */
      });
    return () => {
      cancelled = true;
    };
  }, [ownCharacterId, api, snapshot]);

  const send = (command: Command) => connection.send(command);

  if (!snapshot) {
    return (
      <main className="gx-loading" role="status" aria-live="polite">
        <p>Entrando a la sala…</p>
        <p className="gx-loading-sub">
          El servidor puede tardar ~1 minuto en despertar la primera vez.
        </p>
        <Button variant="ghost" onClick={props.onLeave}>
          ← Volver a campañas
        </Button>
      </main>
    );
  }

  if (snapshot.viewerRole === 'dm') {
    return <VistaMasterScreen snapshot={snapshot} send={send} srd={srd} />;
  }

  // Player without a character in this campaign yet → invite them to create one.
  if (!snapshot.ownCharacterId) {
    return (
      <main className="gx-loading" role="status" aria-live="polite">
        <p>Aún no tienes un personaje en esta campaña.</p>
        <Button onClick={props.onCreateCharacter}>Crear personaje</Button>
        <Button variant="ghost" onClick={props.onLeave}>
          ← Volver a campañas
        </Button>
      </main>
    );
  }

  if (!you) {
    return (
      <main className="gx-loading" role="status" aria-live="polite">
        <p>Cargando tu personaje…</p>
        <Button variant="ghost" onClick={props.onLeave}>
          ← Volver a campañas
        </Button>
      </main>
    );
  }
  return <VistaJugadorScreen snapshot={snapshot} you={you} send={send} />;
}
