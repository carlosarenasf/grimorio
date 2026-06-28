import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditSheetModal } from './EditSheetModal';
import { makeYouCharacter } from './fixture';

describe('EditSheetModal', () => {
  it('renders the character name and basic fields', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />);
    expect(screen.getByText('Editar ficha')).toBeInTheDocument();
    const nameFields = screen.getAllByLabelText(/nombre/i);
    expect(nameFields[0]).toHaveValue('Lyra');
    expect(screen.getByLabelText(/especie/i)).toHaveValue('Elfa');
    expect(screen.getByLabelText(/clase/i)).toHaveValue('Mago');
    expect(screen.getByLabelText(/trasfondo/i)).toHaveValue('Savia');
  });

  it('renders ability scores', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />);
    expect(screen.getByLabelText(/fuerza/i)).toHaveValue(14);
    expect(screen.getByLabelText(/destreza/i)).toHaveValue(16);
    expect(screen.getByLabelText(/constitución/i)).toHaveValue(13);
  });

  it('renders current HP', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />);
    expect(screen.getByLabelText(/pv actuales/i)).toHaveValue(24);
  });

  it('renders notes', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />);
    expect(screen.getByLabelText(/notas/i)).toHaveValue('Busco la fuente de la magia arcana.');
  });

  it('calls onClose when cancel is clicked', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onSave with the patch when save is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />);

    const nameFields = screen.getAllByLabelText(/nombre/i);
    const characterNameField = nameFields[0];
    await userEvent.clear(characterNameField);
    await userEvent.type(characterNameField, 'Lyra Editada');

    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(onSave).toHaveBeenCalledOnce();
    const patch = onSave.mock.calls[0][0];
    expect(patch.name).toBe('Lyra Editada');
    expect(patch.species).toBe('Elfa');
    expect(patch.className).toBe('Mago');
    expect(patch.currentHp).toBe(24);
  });

  it('calls onClose after successful save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows error when save fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));
    const onClose = vi.fn();
    render(<EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo guardar/i);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when clicking the backdrop', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <EditSheetModal you={makeYouCharacter()} onSave={onSave} onClose={onClose} />,
    );
    const backdrop = container.querySelector('.esm__backdrop');
    expect(backdrop).toBeTruthy();
    await userEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
