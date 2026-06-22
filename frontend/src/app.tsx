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
import { useEffect, useMemo, useState } from 'react';
import { createApiClient, createLiveConnection, createSessionStore } from './net/index.js';
import type { Snapshot } from '@grimorio/shared/wire';
import type { Command } from '@grimorio/shared/commands';
import { RegistroScreen } from './screens/Registro/index.js';
import { CampanasScreen } from './screens/Campanas/index.js';
import { CrearPersonajeScreen } from './screens/CrearPersonaje/index.js';
import { VistaMasterScreen, makeSrdSource } from './screens/VistaMaster/index.js';
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
  | { name: 'auth' }
  | { name: 'campaigns' }
  | { name: 'character'; campaignId: string }
  | { name: 'table'; campaignId: string };

export function App() {
  const api = useMemo(() => createApiClient({}), []);
  const srd = useMemo(() => makeSrdSource(), []);
  const session = useMemo(() => createSessionStore(), []);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [view, setView] = useState<View>({ name: 'auth' });

  if (!principal || view.name === 'auth') {
    return (
      <RegistroScreen
        api={api}
        session={session}
        onRegistered={() => {
          setPrincipal(session.get());
          setView({ name: 'campaigns' });
        }}
      />
    );
  }

  if (view.name === 'campaigns') {
    return (
      <CampanasScreen
        api={api}
        principal={principal}
        onEnter={(campaignId) => setView({ name: 'table', campaignId })}
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
      srd={srd}
      campaignId={view.campaignId}
      onLeave={() => setView({ name: 'campaigns' })}
    />
  );
}

function TableView(props: {
  api: ReturnType<typeof createApiClient>;
  srd: ReturnType<typeof makeSrdSource>;
  campaignId: string;
  onLeave: () => void;
}) {
  const { api, campaignId, srd } = props;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [you, setYou] = useState<YouCharacter | null>(null);
  const connection = useMemo(() => createLiveConnection({ campaignId }), [campaignId]);

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
