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
import type { CampaignDTO, CharacterDTO, SpellDTO } from './net/http.js';
import { Button } from './design/index.js';

const abilityMod = (score: number) => Math.floor((score - 10) / 2);
const profBonus = (level: number) => Math.ceil(level / 4) + 1;

/** Map the server's character sheet to the player screen's YouCharacter. */
function toYouCharacter(
  sheet: CharacterDTO,
  combatantId: string | null,
  spellsById: Record<string, SpellDTO>,
): YouCharacter {
  // Every character can make a basic unarmed strike.
  const strMod = abilityMod(sheet.scores.str);
  const unarmed = {
    id: 'basic-unarmed',
    name: 'Golpe sin armas',
    kind: 'weapon' as const,
    bonus: profBonus(sheet.level) + strMod,
    damage: '1d4',
  };
  // Weapon attacks from the sheet + the spells chosen during creation, both as
  // "attacks" so the action economy shows them (weapon → Atacar, spell → Conjuro).
  const weaponAttacks = (sheet.attacks ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    bonus: a.bonus,
    damage: a.damage,
  }));
  const spellAttacks = (sheet.spells ?? [])
    .map((id) => spellsById[id])
    .filter((s): s is SpellDTO => Boolean(s))
    .map((s) => ({
      id: s.id,
      name: s.name,
      kind: 'spell' as const,
      bonus: null,
      damage: s.damage ?? null,
    }));
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
    attacks: [unarmed, ...weaponAttacks, ...spellAttacks],
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
  const [sheet, setSheet] = useState<CharacterDTO | null>(null);
  const [monsters, setMonsters] = useState<MonsterSummary[]>([]);
  const [campaignCharacters, setCampaignCharacters] = useState<{ id: string; name: string }[]>([]);
  const [campaign, setCampaign] = useState<CampaignDTO | null>(null);
  const [spellsById, setSpellsById] = useState<Record<string, SpellDTO>>({});
  const [weaponCatalog, setWeaponCatalog] = useState<import('./net/http.js').WeaponDTO[]>([]);
  const connection = useMemo(() => createLiveConnection({ campaignId }), [campaignId]);

  // Weapon catalogue (for the player's "Añadir arma").
  useEffect(() => {
    let cancelled = false;
    api
      .getWeapons()
      .then((list) => !cancelled && setWeaponCatalog(list))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api]);

  // Load the SRD spell list once so chosen spells resolve to names + damage
  // (player action economy, and the DM's character-sheet view).
  useEffect(() => {
    let cancelled = false;
    api
      .getSpells()
      .then((list) => {
        if (cancelled) return;
        const map: Record<string, SpellDTO> = {};
        for (const s of list) map[s.id] = s;
        setSpellsById(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api]);

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

  // The DM's "Jugadores" panel: load the campaign's characters; refresh when the
  // combatant set changes (e.g. a new player seated/created their character).
  const combatantCount = snapshot?.combatants.length ?? 0;
  useEffect(() => {
    if (!isDm) return;
    let cancelled = false;
    api
      .listCampaignCharacters(campaignId)
      .then((list) => {
        if (!cancelled) setCampaignCharacters(list.map((c) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isDm, api, campaignId, combatantCount]);

  // Load the campaign (with its join code) so the DM can invite from the table.
  useEffect(() => {
    if (!isDm) return;
    let cancelled = false;
    api
      .listCampaigns()
      .then((list) => {
        if (!cancelled) setCampaign(list.find((c) => c.id === campaignId) ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isDm, api, campaignId]);

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
      setSheet(null);
      return;
    }
    let cancelled = false;
    api
      .getCharacter(ownCharacterId)
      .then((s) => {
        if (!cancelled) setSheet(s);
      })
      .catch(() => {
        /* leave sheet null; the player view shows a waiting state */
      });
    return () => {
      cancelled = true;
    };
  }, [ownCharacterId, api]);

  const ownCombatantId =
    snapshot && snapshot.viewerRole === 'player'
      ? (snapshot.combatants.find((c) => c.type === 'pc' && c.characterId === ownCharacterId)?.id ??
        null)
      : null;
  const you = useMemo(
    () => (sheet ? toYouCharacter(sheet, ownCombatantId, spellsById) : null),
    [sheet, ownCombatantId, spellsById],
  );

  // Persist an equip/inventory change to the character sheet.
  const patchSheet = async (patch: Partial<CharacterDTO>) => {
    if (!sheet) return;
    try {
      const updated = await api.updateCharacter(sheet.id, patch);
      setSheet(updated);
    } catch {
      /* ignore — the player can retry */
    }
  };
  const addWeapon = (w: import('./net/http.js').WeaponDTO) => {
    if (!sheet) return;
    const useDex =
      w.ability === 'dex' ||
      (w.ability === 'finesse' &&
        abilityMod(sheet.scores.dex) > abilityMod(sheet.scores.str));
    const mod = useDex ? abilityMod(sheet.scores.dex) : abilityMod(sheet.scores.str);
    const modStr = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '';
    const id = `wpn_${Date.now()}`;
    const toHit = profBonus(sheet.level) + mod;
    const damage = `${w.damage}${modStr}`;
    const attack = {
      id,
      name: w.name,
      kind: 'weapon' as const,
      bonus: toHit,
      damage,
      damageType: w.damageType,
    };
    // Add it as a usable attack AND as an equipped item so it shows in Equipo.
    const item = {
      id,
      name: w.name,
      note: `${toHit >= 0 ? '+' : ''}${toHit} al ataque · ${damage} ${w.damageType}`,
      qty: 1,
      equipped: true,
    };
    void patchSheet({
      attacks: [...(sheet.attacks ?? []), attack],
      inventory: [...(sheet.inventory ?? []), item],
    });
  };
  const addItem = (name: string) =>
    void patchSheet({
      inventory: [
        ...(sheet?.inventory ?? []),
        { id: `itm_${Date.now()}`, name, note: '', qty: 1, equipped: false },
      ],
    });
  const removeItem = (id: string) =>
    void patchSheet({
      inventory: (sheet?.inventory ?? []).filter((i) => i.id !== id),
      // A weapon's item + attack share the same id — drop the attack too.
      attacks: (sheet?.attacks ?? []).filter((a) => a.id !== id),
    });
  const adjustItem = (id: string, delta: number) =>
    void patchSheet({
      inventory: (sheet?.inventory ?? []).map((i) =>
        i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i,
      ),
    });

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
    return (
      <VistaMasterScreen
        snapshot={snapshot}
        send={send}
        srd={srd}
        campaignCharacters={campaignCharacters}
        api={api}
        spellsById={spellsById}
        campaign={campaign ?? undefined}
      />
    );
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
  return (
    <VistaJugadorScreen
      snapshot={snapshot}
      you={you}
      send={send}
      weapons={weaponCatalog}
      onAddWeapon={addWeapon}
      onAddItem={addItem}
      onRemoveItem={removeItem}
      onAdjustItem={adjustItem}
    />
  );
}
