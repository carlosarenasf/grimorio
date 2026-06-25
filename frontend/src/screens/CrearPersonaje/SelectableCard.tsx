import type { ReactNode } from 'react';
import { Button } from '../../design';

export interface SelectableCardProps {
  title: string;
  /** Short meta line under the title (e.g. size · speed). */
  meta?: ReactNode;
  description?: string;
  /** Extra detail rendered below the description (traits, grants, etc.). */
  children?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

/**
 * A selectable choice card used by the Clase/Especie/Trasfondo steps. The whole
 * card is a real <button> with aria-pressed so it is keyboard- and SR-friendly.
 */
export function SelectableCard({
  title,
  meta,
  description,
  children,
  selected,
  onSelect,
}: SelectableCardProps) {
  return (
    <Button
      variant={selected ? 'primary' : 'secondary'}
      className="cp-card"
      aria-pressed={selected}
      data-selected={selected || undefined}
      onClick={onSelect}
    >
      <span className="cp-card__title font-display">{title}</span>
      {meta ? <span className="cp-card__meta eyebrow">{meta}</span> : null}
      {description ? <span className="cp-card__desc">{description}</span> : null}
      {children}
    </Button>
  );
}
