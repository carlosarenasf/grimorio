import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = arcane accent (default action); secondary; ghost (low emphasis). */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Button (DESIGN_SPEC.md §6/§8): real <button>, visible focus ring via
 * :focus-visible in tokens.css, primary/secondary/ghost variants, sizes,
 * disabled state.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...rest} />;
}
