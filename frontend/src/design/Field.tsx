import { useId } from 'react';
import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

type BaseProps = {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
};

type InputFieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
    as?: 'input';
  };

type TextareaFieldProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
    as: 'textarea';
  };

type SelectFieldProps = BaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
    as: 'select';
    children: ReactNode;
  };

export type FieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

/**
 * Labeled input/select/textarea wrapper (DESIGN_SPEC.md §3/§8): uppercase
 * tracked label (eyebrow style), dark input surface, focus glow via
 * :focus-visible (tokens.css), and an associated error message.
 */
export function Field(props: FieldProps) {
  const generatedId = useId();
  const { label, error, hint, className } = props;
  const id = (props as { id?: string }).id ?? generatedId;
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  const sharedClassName = ['field__control', error ? 'field__control--error' : '']
    .filter(Boolean)
    .join(' ');

  let control: ReactNode;
  if (props.as === 'textarea') {
    const { as: _as, label: _l, error: _e, hint: _h, className: _c, ...rest } =
      props;
    control = (
      <textarea
        id={id}
        className={sharedClassName}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    );
  } else if (props.as === 'select') {
    const { as: _as, label: _l, error: _e, hint: _h, className: _c, ...rest } =
      props;
    control = (
      <select
        id={id}
        className={sharedClassName}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    );
  } else {
    const { as: _as, label: _l, error: _e, hint: _h, className: _c, ...rest } =
      props;
    control = (
      <input
        id={id}
        className={sharedClassName}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    );
  }

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className="eyebrow field__label">
        {label}
      </label>
      {control}
      {error ? (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type { ChangeEvent };
