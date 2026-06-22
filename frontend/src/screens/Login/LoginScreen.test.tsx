import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from './LoginScreen';
import { ApiError } from '../../net';

function makeApi(overrides: Record<string, unknown> = {}) {
  return { login: vi.fn(), ...overrides } as never;
}
function makeSession() {
  return { setPrincipal: vi.fn(), clear: vi.fn(), get: vi.fn(), subscribe: vi.fn() } as never;
}

describe('LoginScreen', () => {
  it('logs in and calls onLoggedIn with the entered credentials', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue({ userId: 'u1', displayName: 'Lyra' });
    const session = makeSession();
    const onLoggedIn = vi.fn();
    render(
      <LoginScreen api={makeApi({ login })} session={session} onLoggedIn={onLoggedIn} />,
    );

    await user.type(screen.getByLabelText('Email'), 'lyra@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({
      email: 'lyra@example.com',
      password: 'password123',
    }));
    expect(onLoggedIn).toHaveBeenCalled();
  });

  it('shows an error on wrong credentials (401)', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new ApiError(401, 'Invalid'));
    render(<LoginScreen api={makeApi({ login })} session={makeSession()} />);

    await user.type(screen.getByLabelText('Email'), 'lyra@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrectos/i);
  });

  it('offers a link to register', async () => {
    const user = userEvent.setup();
    const onGoToRegister = vi.fn();
    render(
      <LoginScreen api={makeApi()} session={makeSession()} onGoToRegister={onGoToRegister} />,
    );
    await user.click(screen.getByRole('button', { name: 'Crea una' }));
    expect(onGoToRegister).toHaveBeenCalled();
  });
});
