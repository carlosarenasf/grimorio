import { useEffect, useState } from 'react';
import { Button } from '../../design';
import type { ApiClient, CreateMapPayload, MapDTO } from '../../net';
import { MapLibrary } from './MapLibrary';
import { MapEditor } from './MapEditor';
import { CreateMapModal } from './CreateMapModal';
import './mapa-editor.css';

export interface MapasScreenProps {
  api: ApiClient;
  campaignId: string;
  onBack: () => void;
}

/**
 * Pantalla completa del módulo de mapas: biblioteca + editor.
 *
 * El flujo es: cargar la lista (`listMaps`) → mostrar la biblioteca →
 * "Crear nuevo" abre el modal → al crear abre el editor → al volver se
 * recarga la lista para reflejar cambios. La persistencia del editor la
 * dispara `MapEditor.onSave` contra `updateMap`.
 */
export function MapasScreen({ api, campaignId, onBack }: MapasScreenProps) {
  const [loading, setLoading] = useState(true);
  const [maps, setMaps] = useState<MapDTO[]>([]);
  const [editing, setEditing] = useState<MapDTO | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const list = await api.listMaps(campaignId);
      setMaps(list);
      setError(null);
    } catch {
      setError('No se han podido cargar los mapas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [api, campaignId]);

  async function handleCreate(payload: CreateMapPayload) {
    const created = await api.createMap(campaignId, payload);
    setCreateOpen(false);
    setEditing(created);
    void reload();
  }

  async function handleSaveEditor() {
    if (!editing) return;
    try {
      await api.updateMap(campaignId, editing.id, editing);
    } catch {
      /* ignore; el editor sigue editable */
    }
  }

  async function handleDelete(map: MapDTO) {
    try {
      await api.deleteMap(campaignId, map.id);
      setMaps((prev) => prev.filter((m) => m.id !== map.id));
    } catch {
      /* ignore */
    }
  }

  function handleEditorChange(next: MapDTO) {
    setEditing(next);
  }

  function handleEditorBack() {
    setEditing(null);
    void reload();
  }

  if (loading) {
    return (
      <main className="map-screen" role="status" aria-live="polite">
        <p>Cargando mapas…</p>
      </main>
    );
  }

  if (editing) {
    return (
      <main className="map-screen">
        <MapEditor
          key={editing.id}
          map={editing}
          onChange={handleEditorChange}
          onSave={handleSaveEditor}
          onBack={handleEditorBack}
        />
      </main>
    );
  }

  return (
    <main className="map-screen">
      <header className="map-screen__header">
        <Button variant="ghost" onClick={onBack}>
          ← Volver a la mesa
        </Button>
        <h1 className="font-display map-screen__title">Mapas de la campaña</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Crear nuevo mapa</Button>
      </header>

      {error ? <p className="map-screen__error" role="alert">{error}</p> : null}

      <MapLibrary maps={maps} onOpen={setEditing} onDelete={handleDelete} />

      {createOpen ? (
        <CreateMapModal onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      ) : null}
    </main>
  );
}