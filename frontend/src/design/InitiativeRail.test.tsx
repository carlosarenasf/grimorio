import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InitiativeRail } from './InitiativeRail';
import type { InitiativeToken } from './InitiativeRail';

const tokens: InitiativeToken[] = [
  {
    id: 'pc-1',
    name: 'Lyra',
    initiative: 18,
    type: 'pc',
    hp: 24,
    maxHp: 30,
    conditions: [{ label: 'Bendecido', color: '#7C9A82' }],
  },
  {
    id: 'mon-1',
    name: 'Dragón joven',
    initiative: 15,
    type: 'monster',
    statusLabel: 'Herido',
    conditions: [],
  },
  {
    id: 'pc-2',
    name: 'Borin',
    initiative: 9,
    type: 'pc',
    hp: 12,
    maxHp: 40,
    conditions: [
      { label: 'Envenenado', color: '#B4452E' },
      { label: 'Asustado', color: '#B4452E' },
    ],
  },
];

describe('InitiativeRail', () => {
  it('renders one token per combatant, ordered by initiative', () => {
    render(<InitiativeRail tokens={tokens} activeId="pc-1" />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Lyra');
    expect(items[1]).toHaveTextContent('Dragón joven');
    expect(items[2]).toHaveTextContent('Borin');
  });

  it('marks the active token with aria-current="true" and not the others', () => {
    render(<InitiativeRail tokens={tokens} activeId="mon-1" />);

    const active = screen.getByText('Dragón joven').closest('[role="listitem"]');
    expect(active).toHaveAttribute('aria-current', 'true');

    const inactive = screen.getByText('Lyra').closest('[role="listitem"]');
    expect(inactive).not.toHaveAttribute('aria-current', 'true');
  });

  it('shows numeric HP for combatants when hp is present', () => {
    render(<InitiativeRail tokens={tokens} activeId="pc-1" />);
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it("renders a monster's statusLabel instead of numeric HP when hp is absent", () => {
    render(<InitiativeRail tokens={tokens} activeId="pc-1" />);
    expect(screen.getByText('Herido')).toBeInTheDocument();
  });

  it('renders condition chips for each combatant', () => {
    render(<InitiativeRail tokens={tokens} activeId="pc-1" />);
    expect(screen.getByText('Bendecido')).toBeInTheDocument();
    expect(screen.getByText('Envenenado')).toBeInTheDocument();
    expect(screen.getByText('Asustado')).toBeInTheDocument();
  });

  it('renders nothing extra when a combatant has no conditions', () => {
    render(<InitiativeRail tokens={tokens} activeId="pc-1" />);
    const dragonItem = screen
      .getByText('Dragón joven')
      .closest('[role="listitem"]') as HTMLElement;
    expect(dragonItem.querySelectorAll('.condition-chip')).toHaveLength(0);
  });
});
