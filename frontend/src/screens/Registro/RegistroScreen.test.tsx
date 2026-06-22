import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistroScreen } from './RegistroScreen';
import { ApiError } from '../../net';
import type { ApiClient, Principal, SessionStore } from '../../net';

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    listCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    invite: vi.fn(),
    joinByCode: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    getSnapshot: vi.fn(),
    ...overrides,
  } as unknown as ApiClient;
}

function makeSession(): SessionStore {
  return {
    setPrincipal: vi.fn(),
    clear: vi.fn(),
    get: vi.fn(() => null),
    subscribe: vi.fn(() => () => {}),
  };
}

const PRINCIPAL: Principal = { userId: 'u1', displayName: 'Lyra' };

describe('RegistroScreen', () => {
  it('disables submit until name, email and password(>=8) are valid', async () => {
    const api = makeApi();
    const session = makeSession();
    render(<RegistroScreen api={api} session={session} />);

    const user = userEvent.setup();
    const submit = screen.getByRole('button', { name: /crear cuenta/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Nombre'), 'Lyra');
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Email'), 'lyra@example.com');
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Contraseña'), 'short');
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Contraseña'), '1234');
    expect(submit).toBeEnabled();
  });

  it('keeps submit disabled with an invalid email', async () => {
    const api = makeApi();
    const session = makeSession();
    render(<RegistroScreen api={api} session={session} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Nombre'), 'Lyra');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Contraseña'), 'longenoughpw');

    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeDisabled();
  });

  it('increases the strength meter as the password gets stronger', async () => {
    const api = makeApi();
    const session = makeSession();
    render(<RegistroScreen api={api} session={session} />);

    const user = userEvent.setup();
    const passwordInput = screen.getByLabelText('Contraseña');
    const meter = screen.getByTestId('password-strength-meter');

    await user.type(passwordInput, 'a');
    const weakScore = Number(meter.getAttribute('data-strength'));

    await user.clear(passwordInput);
    await user.type(passwordInput, 'Abcdef12!');
    const strongScore = Number(meter.getAttribute('data-strength'));

    expect(strongScore).toBeGreaterThan(weakScore);
    expect(strongScore).toBe(4);
  });

  it('calls api.register with the typed values and sets the session on success', async () => {
    const principal = PRINCIPAL;
    const register = vi.fn().mockResolvedValue(principal);
    const api = makeApi({ register });
    const session = makeSession();
    const onRegistered = vi.fn();

    render(
      <RegistroScreen
        api={api}
        session={session}
        onRegistered={onRegistered}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Nombre'), 'Lyra');
    await user.type(screen.getByLabelText('Email'), 'lyra@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Abcdef12!');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(register).toHaveBeenCalledWith({
      displayName: 'Lyra',
      email: 'lyra@example.com',
      password: 'Abcdef12!',
    });

    await vi.waitFor(() => {
      expect(session.setPrincipal).toHaveBeenCalledWith(principal);
    });
    expect(onRegistered).toHaveBeenCalledTimes(1);
  });

  it('shows the email-taken message on a 409 ApiError', async () => {
    const register = vi
      .fn()
      .mockRejectedValue(new ApiError(409, 'conflict', 'EMAIL_TAKEN'));
    const api = makeApi({ register });
    const session = makeSession();

    render(<RegistroScreen api={api} session={session} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Nombre'), 'Lyra');
    await user.type(screen.getByLabelText('Email'), 'lyra@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Abcdef12!');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(
      await screen.findByText('Ese email ya está en uso.'),
    ).toBeInTheDocument();
    expect(session.setPrincipal).not.toHaveBeenCalled();
  });

  it('shows a field validation error after the user blurs an invalid field', async () => {
    const api = makeApi();
    const session = makeSession();
    render(<RegistroScreen api={api} session={session} />);

    const user = userEvent.setup();
    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'bad-email');
    await user.tab();

    expect(
      await screen.findByText('Introduce un email válido.'),
    ).toBeInTheDocument();
  });
});
