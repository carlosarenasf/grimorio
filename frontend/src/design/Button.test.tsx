import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders a real <button> element', () => {
    render(<Button>Tirar</Button>);
    expect(screen.getByRole('button', { name: 'Tirar' }).tagName).toBe(
      'BUTTON',
    );
  });

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tirar</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Tirar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Tirar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Tirar' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to the primary (arcane) variant', () => {
    render(<Button>Tirar</Button>);
    expect(screen.getByRole('button')).toHaveClass('button--primary');
  });

  it('applies the secondary variant class', () => {
    render(<Button variant="secondary">Cancelar</Button>);
    expect(screen.getByRole('button')).toHaveClass('button--secondary');
  });

  it('applies the ghost variant class', () => {
    render(<Button variant="ghost">Más</Button>);
    expect(screen.getByRole('button')).toHaveClass('button--ghost');
  });

  it('applies size classes', () => {
    render(<Button size="sm">Pequeño</Button>);
    expect(screen.getByRole('button')).toHaveClass('button--sm');
  });
});
