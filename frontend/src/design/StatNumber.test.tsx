import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatNumber } from './StatNumber';

describe('StatNumber', () => {
  it('renders the numeric value', () => {
    render(<StatNumber value={42} label="HP" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('uses tabular-nums via the tabular-nums helper class', () => {
    render(<StatNumber value={42} label="HP" />);
    expect(screen.getByText('42')).toHaveClass('tabular-nums');
  });

  it('renders a sign prefix for positive modifiers when signed', () => {
    render(<StatNumber value={3} label="MOD" signed />);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('renders the sign prefix for negative modifiers when signed', () => {
    render(<StatNumber value={-2} label="MOD" signed />);
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('applies a damage role color for low/critical values', () => {
    render(<StatNumber value={1} label="HP" role="damage" />);
    expect(screen.getByText('1')).toHaveClass('stat-number--damage');
  });
});
