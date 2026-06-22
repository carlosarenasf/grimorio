import type { ReactNode } from 'react';

export interface PanelProps {
  /** Small uppercase tracked label above the title (section context). */
  eyebrow?: string;
  /** Panel title, rendered in the display (Spectral) font role. */
  title: string;
  /** Optional controls rendered in the header, aligned opposite the title. */
  actions?: ReactNode;
  /** Marks this panel as DM-only info: frost tint + lock affordance (§5, §6). */
  dmOnly?: boolean;
  /** Scrollable body content. */
  children?: ReactNode;
  /** Empty-state content shown instead of children when there is nothing to show. */
  empty?: ReactNode;
  className?: string;
}

/**
 * Generic Panel (DESIGN_SPEC.md §5): header with eyebrow + title + actions,
 * a scrollable body, a dmOnly variant (frost tint + lock glyph), and an
 * empty-state slot. Every new feature panel (bestiary, NPC generator, maps,
 * DM assistant) is an instance of this component.
 */
export function Panel({
  eyebrow,
  title,
  actions,
  dmOnly = false,
  children,
  empty,
  className,
}: PanelProps) {
  const hasContent = children !== undefined && children !== null;

  return (
    <section
      className={['panel', dmOnly ? 'panel--dm-only' : '', className]
        .filter(Boolean)
        .join(' ')}
      data-dm-only={dmOnly || undefined}
    >
      <header className="panel__header">
        <div className="panel__heading">
          {dmOnly ? (
            <span
              className="panel__lock"
              data-testid="panel-lock-icon"
              aria-label="Solo visible para el máster"
              role="img"
            >
              🔒
            </span>
          ) : null}
          {eyebrow ? <p className="eyebrow panel__eyebrow">{eyebrow}</p> : null}
          <h3 className="font-display panel__title">{title}</h3>
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </header>
      <div className="panel__body">{hasContent ? children : empty}</div>
    </section>
  );
}
