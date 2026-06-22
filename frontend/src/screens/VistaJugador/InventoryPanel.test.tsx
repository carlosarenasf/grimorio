import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryPanel } from './InventoryPanel';
import { makeYouCharacter } from './fixture';

describe('InventoryPanel', () => {
  it('splits equipped items from the backpack and shows gold', () => {
    render(<InventoryPanel you={makeYouCharacter()} />);
    expect(screen.getByText('Cota de cuero')).toBeInTheDocument();
    expect(screen.getByText('Espada corta')).toBeInTheDocument();
    expect(screen.getByText('Antorcha')).toBeInTheDocument();
    expect(screen.getByText('Poción de curación')).toBeInTheDocument();
    expect(screen.getByLabelText('Oro')).toHaveValue(35);
  });

  it('a qty stepper increases the local count without sending a command', async () => {
    const send = vi.fn();
    render(<InventoryPanel you={makeYouCharacter()} send={send} />);

    const row = screen.getByText('Antorcha').closest('li') as HTMLElement;
    const plus = within(row).getByRole('button', { name: /aumentar/i });
    await userEvent.click(plus);

    expect(within(row).getByText('4')).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it('a qty stepper decreases the local count, not below 0', async () => {
    render(<InventoryPanel you={makeYouCharacter()} />);
    const row = screen.getByText('Poción de curación').closest('li') as HTMLElement;
    const minus = within(row).getByRole('button', { name: /disminuir/i });
    await userEvent.click(minus);
    await userEvent.click(minus);
    await userEvent.click(minus);
    expect(within(row).getByText('0')).toBeInTheDocument();
  });

  it('remove takes the item out of the list', async () => {
    render(<InventoryPanel you={makeYouCharacter()} />);
    const row = screen.getByText('Antorcha').closest('li') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /quitar/i }));
    expect(screen.queryByText('Antorcha')).not.toBeInTheDocument();
  });
});
