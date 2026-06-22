import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from './Field';

describe('Field', () => {
  it('renders an input wired to its uppercase-tracked label', async () => {
    render(<Field label="Nombre" value="" onChange={() => {}} />);

    const input = screen.getByLabelText('Nombre');
    expect(input.tagName).toBe('INPUT');
    expect(screen.getByText('Nombre')).toHaveClass('eyebrow');
  });

  it('calls onChange when typing in an input', async () => {
    const onChange = vi.fn();
    render(<Field label="Nombre" value="" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Nombre'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders a textarea when as="textarea"', () => {
    render(
      <Field as="textarea" label="Notas" value="" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Notas').tagName).toBe('TEXTAREA');
  });

  it('renders a select with options when as="select"', () => {
    render(
      <Field as="select" label="Clase" value="mago" onChange={() => {}}>
        <option value="mago">Mago</option>
        <option value="guerrero">Guerrero</option>
      </Field>,
    );

    const select = screen.getByLabelText('Clase');
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'Mago' })).toBeInTheDocument();
  });

  it('shows an error message associated to the input', () => {
    render(
      <Field
        label="Email"
        value=""
        onChange={() => {}}
        error="Email no válido"
      />,
    );

    expect(screen.getByText('Email no válido')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
