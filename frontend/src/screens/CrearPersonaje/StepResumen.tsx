import { Field } from '../../design';

export interface StepResumenProps {
  name: string;
  notes: string;
  onChangeName: (name: string) => void;
  onChangeNotes: (notes: string) => void;
}

/**
 * Step 7 — name + optional notes. The live summary card lives in the aside, so
 * this step only collects the remaining free-text details.
 */
export function StepResumen({
  name,
  notes,
  onChangeName,
  onChangeNotes,
}: StepResumenProps) {
  return (
    <div className="cp-resumen">
      <Field
        label="Nombre"
        value={name}
        onChange={(e) => onChangeName(e.target.value)}
      />
      <Field
        as="textarea"
        label="Notas (opcional)"
        rows={6}
        value={notes}
        onChange={(e) => onChangeNotes(e.target.value)}
      />
    </div>
  );
}
