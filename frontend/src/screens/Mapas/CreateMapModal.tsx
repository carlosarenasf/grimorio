import { useState } from 'react';
import { Button, Field } from '../../design';
import type { CreateMapPayload } from '../../net';

export interface CreateMapModalProps {
  onClose: () => void;
  onCreate: (payload: CreateMapPayload) => Promise<void>;
}

const ENVIRONMENTS = [
  'bosque',
  'mina',
  'dungeon',
  'pantano',
  'montaña',
  'desierto',
  'pueblo',
  'castillo',
  'casa',
] as const;

/**
 * Modal para crear un mapa nuevo: solicita nombre, tipo e entorno.
 * `width`/`height`/`gridSize` por defecto a 20×15 celdas con celda de 32px.
 */
export function CreateMapModal({ onClose, onCreate }: CreateMapModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'exterior' | 'interior'>('exterior');
  const [environment, setEnvironment] = useState<string>(ENVIRONMENTS[0]);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [gridSize, setGridSize] = useState(32);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onCreate({
        name: name.trim(),
        mapType: type,
        environment,
        width,
        height,
        gridSize,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="map-modal-overlay" role="dialog" aria-modal="true" aria-label="Crear mapa">
      <form className="map-modal" onSubmit={submit}>
        <h2 className="font-display">Crear nuevo mapa</h2>
        <Field label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <Field label="Tipo" as="select" value={type} onChange={(e) => setType(e.target.value as 'exterior' | 'interior')}>
          <option value="exterior">Exterior</option>
          <option value="interior">Interior</option>
        </Field>
        <Field label="Entorno" as="select" value={environment} onChange={(e) => setEnvironment(e.target.value)}>
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>
              {env}
            </option>
          ))}
        </Field>
        <div className="map-modal__row">
          <Field
            label="Ancho (celdas)"
            type="number"
            min={5}
            max={100}
            value={width}
            onChange={(e) => setWidth(Math.max(5, Math.min(100, Number(e.target.value) || 20)))}
          />
          <Field
            label="Alto (celdas)"
            type="number"
            min={5}
            max={100}
            value={height}
            onChange={(e) => setHeight(Math.max(5, Math.min(100, Number(e.target.value) || 15)))}
          />
          <Field
            label="Celda (px)"
            type="number"
            min={16}
            max={128}
            step={8}
            value={gridSize}
            onChange={(e) => setGridSize(Math.max(16, Math.min(128, Number(e.target.value) || 32)))}
          />
        </div>
        <div className="map-modal__actions">
          <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            Crear mapa
          </Button>
        </div>
      </form>
    </div>
  );
}