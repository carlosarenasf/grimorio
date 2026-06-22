import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PublicLogPanel } from './PublicLogPanel';
import { makePlayerSnapshot } from './fixture';

describe('PublicLogPanel', () => {
  it('lists public rolls with their breakdown and total', () => {
    render(<PublicLogPanel snapshot={makePlayerSnapshot()} />);
    expect(screen.getByText(/lyra/i)).toBeInTheDocument();
    expect(screen.getByText('14 + 5')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
  });

  it('shows an empty-state invitation when there are no rolls', () => {
    render(<PublicLogPanel snapshot={makePlayerSnapshot({ rollLog: [] })} />);
    expect(screen.getByText(/aún no hay tiradas/i)).toBeInTheDocument();
  });
});
