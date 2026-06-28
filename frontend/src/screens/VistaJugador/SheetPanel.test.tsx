import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SheetPanel } from './SheetPanel';
import { makeYouCharacter } from './fixture';

describe('SheetPanel', () => {
  it('shows the character name and current/max HP', () => {
    render(<SheetPanel you={makeYouCharacter()} />);
    expect(screen.getByText('Lyra')).toBeInTheDocument();
    expect(screen.getByLabelText(/pv actuales/i)).toHaveTextContent('24');
    expect(screen.getByText(/30/)).toBeInTheDocument();
  });

  it('shows all 6 ability modifiers, signed', () => {
    render(<SheetPanel you={makeYouCharacter({ scores: { str: 14, dex: 16, con: 13, int: 10, wis: 12, cha: 8 } })} />);
    // str 14 -> +2, dex 16 -> +3, con 13 -> +1, int 10 -> +0, wis 12 -> +1, cha 8 -> -1
    expect(screen.getByLabelText(/mod fuerza/i)).toHaveTextContent('+2');
    expect(screen.getByLabelText(/mod destreza/i)).toHaveTextContent('+3');
    expect(screen.getByLabelText(/mod constitución/i)).toHaveTextContent('+1');
    expect(screen.getByLabelText(/mod inteligencia/i)).toHaveTextContent('0');
    expect(screen.getByLabelText(/mod sabiduría/i)).toHaveTextContent('+1');
    expect(screen.getByLabelText(/mod carisma/i)).toHaveTextContent('-1');
  });

  it('shows CA, velocidad, competencia and iniciativa', () => {
    render(<SheetPanel you={makeYouCharacter({ armorClass: 15, speed: 9, proficiencyBonus: 2, initiative: 3 })} />);
    expect(screen.getByLabelText(/^ca$/i)).toHaveTextContent('15');
    expect(screen.getByLabelText(/velocidad/i)).toHaveTextContent('9');
    expect(screen.getByLabelText(/competencia/i)).toHaveTextContent('+2');
    expect(screen.getByLabelText(/^iniciativa$/i)).toHaveTextContent('+3');
  });

  it('tints HP as damage when below 25% of max', () => {
    render(<SheetPanel you={makeYouCharacter({ currentHp: 5, maxHp: 30 })} />);
    const hp = screen.getByLabelText(/pv actuales/i);
    expect(hp.className).toMatch(/damage/);
  });

  it('shows "Editar ficha" button when onEditSheet is provided', () => {
    const onEditSheet = vi.fn();
    render(<SheetPanel you={makeYouCharacter()} onEditSheet={onEditSheet} />);
    expect(screen.getByRole('button', { name: /editar ficha/i })).toBeInTheDocument();
  });

  it('does not show "Editar ficha" button when onEditSheet is not provided', () => {
    render(<SheetPanel you={makeYouCharacter()} />);
    expect(screen.queryByRole('button', { name: /editar ficha/i })).not.toBeInTheDocument();
  });

  it('calls onEditSheet when "Editar ficha" is clicked', async () => {
    const onEditSheet = vi.fn();
    render(<SheetPanel you={makeYouCharacter()} onEditSheet={onEditSheet} />);
    await userEvent.click(screen.getByRole('button', { name: /editar ficha/i }));
    expect(onEditSheet).toHaveBeenCalledOnce();
  });
});
