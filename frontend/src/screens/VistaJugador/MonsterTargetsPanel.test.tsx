import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterTargetsPanel } from './MonsterTargetsPanel';
import type { PlayerSnapshot } from './types';

function snapshot(): PlayerSnapshot {
  return {
    liveTableId: 't1',
    campaignId: 'c1',
    viewerRole: 'player',
    ownCharacterId: 'char1',
    combat: { active: true, round: 1, order: ['m1'], currentTurnIndex: 0 },
    combatants: [
      { id: 'm1', type: 'monster', name: 'Goblin', initiative: 12, conditions: [], statusLabel: 'Herido' },
      { id: 'pc1', type: 'pc', name: 'Lyra', initiative: 18, conditions: [], currentHp: 20, maxHp: 30 },
    ],
    rollLog: [],
    eventLog: [],
    version: 1,
  };
}

describe('MonsterTargetsPanel', () => {
  it('lets a player apply damage to a monster (any turn) and never shows numeric HP', async () => {
    const send = vi.fn();
    render(<MonsterTargetsPanel snapshot={snapshot()} send={send} />);

    // Only the monster is listed (not the PC), with a status label, no number.
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Herido')).toBeInTheDocument();
    expect(screen.queryByText('Lyra')).toBeNull();

    const amount = screen.getByLabelText(/daño a goblin/i);
    await userEvent.clear(amount);
    await userEvent.type(amount, '6');
    await userEvent.click(screen.getByRole('button', { name: /^daño$/i }));

    expect(send).toHaveBeenCalledWith({ type: 'ApplyDamage', combatantId: 'm1', amount: 6 });
  });
});
