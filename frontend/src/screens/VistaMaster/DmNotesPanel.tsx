import { useEffect, useState } from 'react';
import { Panel } from '../../design';
import type { MasterSnapshot, Send } from './types';

export interface DmNotesPanelProps {
  snapshot: MasterSnapshot;
  send: Send;
}

/**
 * Notas del máster panel (RIGHT column): a dm_only Panel (frost tint + lock).
 * The textarea is bound to snapshot.dmNotes; on blur it persists via
 * AppendDmNote (the command replaces the stored notes with the full text).
 */
export function DmNotesPanel({ snapshot, send }: DmNotesPanelProps) {
  const [draft, setDraft] = useState(snapshot.dmNotes);

  // Keep the local draft in sync when a new snapshot arrives (e.g. another
  // device edited the notes), but only when the user isn't mid-edit.
  useEffect(() => {
    setDraft(snapshot.dmNotes);
  }, [snapshot.dmNotes]);

  function commit() {
    if (draft !== snapshot.dmNotes) {
      send({ type: 'AppendDmNote', notes: draft });
    }
  }

  return (
    <Panel eyebrow="Privado" title="Notas del máster" dmOnly>
      <label className="eyebrow vm-notes__label" htmlFor="vm-dm-notes">
        Notas del máster
      </label>
      <textarea
        id="vm-dm-notes"
        className="field__control vm-notes__textarea"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        placeholder="Secretos, ganchos, recordatorios… solo para tus ojos."
        rows={6}
      />
    </Panel>
  );
}
