import { useEffect, useMemo, useState } from 'react';
import { createLiveConnection } from '../../net';
import type { LiveConnection } from '../../net';
import type { MasterSnapshot } from '@grimorio/shared/wire';
import type { Command } from '@grimorio/shared/commands';
import { VistaMasterScreen } from './VistaMasterScreen';
import type { SrdSource } from './types';

export interface VistaMasterContainerProps {
  campaignId: string;
  srd: SrdSource;
  /** Override for tests; defaults to a real WS-backed LiveConnection. */
  connection?: LiveConnection;
  baseUrl?: string;
}

/**
 * Production wiring: connects a LiveConnection, feeds its master snapshots into
 * VistaMasterScreen and forwards commands. The tested component
 * (VistaMasterScreen) takes snapshot+send as props, so this thin container is
 * the only part that touches the network.
 */
export function VistaMasterContainer({
  campaignId,
  srd,
  connection,
  baseUrl,
}: VistaMasterContainerProps) {
  const conn = useMemo(
    () => connection ?? createLiveConnection({ campaignId, baseUrl }),
    [connection, campaignId, baseUrl],
  );
  const [snapshot, setSnapshot] = useState<MasterSnapshot | null>(null);

  useEffect(() => {
    const off = conn.onSnapshot((snap) => {
      if (snap.viewerRole === 'dm') setSnapshot(snap);
    });
    conn.connect();
    return () => {
      off();
      conn.close();
    };
  }, [conn]);

  const send = (command: Command) => conn.send(command);

  if (!snapshot) {
    return (
      <div className="vm-screen" role="status">
        <p style={{ padding: 24 }}>Entrando a la sala…</p>
      </div>
    );
  }

  return <VistaMasterScreen snapshot={snapshot} send={send} srd={srd} />;
}
