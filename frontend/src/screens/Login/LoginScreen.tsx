import { useState } from 'react';
import type { FormEvent } from 'react';
import '../../design/tokens.css';
import '../../design/components.css';
import { Button, Field } from '../../design';
import type { ApiClient, SessionStore } from '../../net';
import { ApiError } from '../../net';
import '../Registro/registro.css';

export interface LoginScreenProps {
  /** Injected API client (no hidden singleton). */
  api: ApiClient;
  /** Injected session store; `setPrincipal` is called on successful login. */
  session: SessionStore;
  /** Called after a successful login + session set. */
  onLoggedIn?: () => void;
  /** Optional: navigate to the register screen. */
  onGoToRegister?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login screen: email + password, mirroring the Registro card. Spanish copy,
 * §7 voice. Wrong credentials surface a single, non-enumerating error.
 */
export function LoginScreen({ api, session, onLoggedIn, onGoToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length > 0;
  const formValid = emailValid && passwordValid;

  const emailError = touched.email && !emailValid ? 'Introduce un email válido.' : undefined;
  const passwordError =
    touched.password && !passwordValid ? 'Escribe tu contraseña.' : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setAuthError(null);
    if (!formValid || submitting) return;

    setSubmitting(true);
    try {
      const principal = await api.login({ email, password });
      session.setPrincipal(principal);
      onLoggedIn?.();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthError('Email o contraseña incorrectos.');
      } else {
        setAuthError('No se ha podido iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="registro-screen">
      <div className="registro-card">
        <div className="registro-brand">
          <span className="registro-brand__mark" aria-hidden="true">
            ⟁
          </span>
          <h1 className="font-display registro-brand__title">Grimorio</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
            error={emailError}
            autoComplete="email"
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, password: true }))}
            error={passwordError}
            autoComplete="current-password"
          />

          {authError ? (
            <p className="registro-error" role="alert">
              {authError}
            </p>
          ) : null}

          <Button type="submit" disabled={!formValid || submitting} size="lg">
            {submitting ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>

        {onGoToRegister ? (
          <p className="registro-login-link">
            ¿No tienes cuenta?{' '}
            <button type="button" className="link-button" onClick={onGoToRegister}>
              Crea una
            </button>
          </p>
        ) : null}
      </div>
    </main>
  );
}
