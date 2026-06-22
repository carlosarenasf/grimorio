/**
 * App shell — minimal state-driven navigation (no router dependency).
 *
 * Flow: Registro → Campañas → (per campaign) Crear personaje / Mesa en vivo.
 * The live table connects a LiveConnection and renders the master or player
 * view based on the server-projected snapshot's `viewerRole`.
 *
 * Known follow-up: the PlayerSnapshot carries only public combat data + the
 * viewer's `ownCharacterId`, not the full owned sheet (scores/attacks/inventory).
 * Until the projection includes the owner's full sheet (or a GET /characters/:id
 * endpoint exists), the player view is seeded from the public combatant only.
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
import { Button } from './design/index.js';

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
  const { campaignId, srd } = props;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const connection = useMemo(() => createLiveConnection({ campaignId }), [campaignId]);

  useEffect(() => {
    const off = connection.onSnapshot((s) => setSnapshot(s));
    connection.connect();
    return () => {
      off();
      connection.close();
    };
  }, [connection]);

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

  // Player view: seed `you` from the public own-combatant. Full sheet data is a
  // documented follow-up (see file header).
  const own = snapshot.combatants.find((c) => c.id === snapshot.ownCharacterId);
  const you: YouCharacter = {
    combatantId: own?.id ?? snapshot.ownCharacterId ?? null,
    characterId: snapshot.ownCharacterId ?? '',
    name: own?.name ?? 'Tu personaje',
    scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    maxHp: own?.maxHp ?? 0,
    currentHp: own?.currentHp ?? 0,
    armorClass: 10,
    speed: 9,
    proficiencyBonus: 2,
    initiative: own?.initiative ?? 0,
    attacks: [],
    inventory: [],
    gold: 0,
  };
  return <VistaJugadorScreen snapshot={snapshot} you={you} send={send} />;
}
