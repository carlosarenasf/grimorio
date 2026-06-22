import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PublicRailPanel } from './PublicRailPanel';
import { makePlayerSnapshot } from './fixture';

describe('PublicRailPanel', () => {
  it('renders a monster row with its statusLabel and no numeric HP', () => {
    render(<PublicRailPanel snapshot={makePlayerSnapshot()} />);
    const rail = screen.getByRole('list', { name: /tira de iniciativa/i });
    const monsterRow = within(rail).getByText('Dragón joven').closest('[role="listitem"]') as HTMLElement;

    expect(within(monsterRow).getByText('Herido')).toBeInTheDocument();
    // No numeric HP should ever render for a dm_only monster on the player's rail.
    expect(within(monsterRow).queryByText(/\bPV\b/i)).not.toBeInTheDocument();
  });

  it('renders PC rows with numeric HP', () => {
    render(<PublicRailPanel snapshot={makePlayerSnapshot()} />);
    const rail = screen.getByRole('list', { name: /tira de iniciativa/i });
    const pcRow = within(rail).getByText('Lyra').closest('[role="listitem"]') as HTMLElement;
    expect(within(pcRow).getByText('24')).toBeInTheDocument();
  });

  it('marks the active combatant with aria-current', () => {
    render(<PublicRailPanel snapshot={makePlayerSnapshot()} />);
    const rail = screen.getByRole('list', { name: /tira de iniciativa/i });
    const active = within(rail).getByText('Lyra').closest('[role="listitem"]');
    expect(active).toHaveAttribute('aria-current', 'true');
  });
});
