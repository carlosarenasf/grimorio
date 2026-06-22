import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TurnBanner } from './TurnBanner';

describe('TurnBanner', () => {
  it('shows "Es tu turno" when it is your turn', () => {
    render(<TurnBanner isYourTurn activeName="Lyra" round={2} combatActive />);
    expect(screen.getByText(/es tu turno/i)).toBeInTheDocument();
  });

  it('shows "Turno de X" when it is not your turn', () => {
    render(
      <TurnBanner isYourTurn={false} activeName="Dragón joven" round={2} combatActive />,
    );
    expect(screen.getByText(/turno de dragón joven/i)).toBeInTheDocument();
  });

  it('shows a waiting state when combat has not started', () => {
    render(<TurnBanner isYourTurn={false} activeName={null} round={1} combatActive={false} />);
    expect(screen.getByText(/sin combate/i)).toBeInTheDocument();
  });
});
