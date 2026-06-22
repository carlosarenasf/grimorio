import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import '../../design/tokens.css';
import '../../design/components.css';
import { Button, Field } from '../../design';
import type { ApiClient } from '../../net';
import { ApiError } from '../../net';
import type { SessionStore } from '../../net';
import { passwordStrength, passwordStrengthLabel } from './strength';
import './registro.css';

export interface RegistroScreenProps {
  /** Injected API client (no hidden singleton — see screens scope rules). */
  api: ApiClient;
  /** Injected session store; `setPrincipal` is called on successful register. */
  session: SessionStore;
  /** Called after a successful register + session set. */
  onRegistered?: () => void;
  /** Optional: navigate to login (kept out of scope, screen only surfaces the link). */
  onGoToLogin?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

/**
 * Registro screen (DESIGN_SPEC.md §4.b/§7): centered card, brand mark,
 * name/email/password fields, a 4-bar password-strength meter, submit.
 * Spanish copy, voice from §7 (direct, no filler, errors with direction).
 */
export function RegistroScreen({
  api,
  session,
  onRegistered,
  onGoToLogin,
}: RegistroScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  function touch(field: 'name' | 'email' | 'password') {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const meterLabelId = useId();
  const strength = useMemo(() => passwordStrength(password), [password]);

  const nameValid = name.trim().length > 0;
  const emailValid = isValidEmail(email);
  const passwordValid = password.length >= 8;
  const formValid = nameValid && emailValid && passwordValid;

  const nameError = touched.name && !nameValid ? 'El nombre es obligatorio.' : undefined;
  const emailError =
    touched.email && !emailValid ? 'Introduce un email válido.' : undefined;
  const passwordError =
    touched.password && !passwordValid
      ? 'La contraseña debe tener al menos 8 caracteres.'
      : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true });
    setAuthError(null);

    if (!formValid || submitting) return;

    setSubmitting(true);
    try {
      const principal = await api.register({
        displayName: name.trim(),
        email,
        password,
      });
      session.setPrincipal(principal);
      onRegistered?.();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setAuthError('Ese email ya está en uso.');
        } else {
          setAuthError(error.message || 'No se ha podido crear la cuenta.');
        }
      } else {
        setAuthError('No se ha podido crear la cuenta. Inténtalo de nuevo.');
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
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => touch('name')}
            error={nameError}
            autoComplete="name"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => touch('email')}
            error={emailError}
            autoComplete="email"
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => touch('password')}
            error={passwordError}
            autoComplete="new-password"
            aria-describedby={meterLabelId}
          />

          <div
            className="password-strength"
            data-testid="password-strength-meter"
            data-strength={strength}
          >
            <div className="password-strength__bars" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={
                    'password-strength__bar' +
                    (index < strength ? ' password-strength__bar--filled' : '')
                  }
                />
              ))}
            </div>
            <p id={meterLabelId} className="password-strength__label">
              Fuerza: {passwordStrengthLabel(strength)}
            </p>
          </div>

          {authError ? (
            <p className="registro-error" role="alert">
              {authError}
            </p>
          ) : null}

          <Button type="submit" disabled={!formValid || submitting} size="lg">
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        {onGoToLogin ? (
          <p className="registro-login-link">
            ¿Ya tienes cuenta?{' '}
            <button type="button" className="link-button" onClick={onGoToLogin}>
              Inicia sesión
            </button>
          </p>
        ) : null}
      </div>
    </main>
  );
}
