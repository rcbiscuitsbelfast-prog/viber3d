/**
 * Medieval-style button. Replit UI–inspired; uses /replit-ui/ assets when available.
 * See MASTER_PLAN.md – reusable wooden-plank style.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface CustomButtonProps {
  onClick?: () => void;
  children: ReactNode;
  size?: 'small' | 'large';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  /** If provided, renders as <Link> instead of <button> */
  to?: string;
}

const sizes = {
  small: 'min-h-[44px] px-4 py-2 text-sm font-bold',
  large: 'min-h-[100px] aspect-[3/1] px-10 py-4 text-lg font-bold',
};

export function CustomButton({
  onClick,
  children,
  size = 'large',
  disabled = false,
  className = '',
  fullWidth = false,
  to,
}: CustomButtonProps) {
  const base =
    'relative inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white drop-shadow-md';
  const sizeClass = sizes[size];
  const widthClass = fullWidth ? 'w-full' : '';

  const style =
    size === 'large'
      ? {
          backgroundImage: 'url(/replit-ui/big-button.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat' as const,
          backgroundPosition: 'center',
        }
      : {
          backgroundImage: 'url(/replit-ui/small-button.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat' as const,
          backgroundPosition: 'center',
        };

  const content = (
    <span className="relative z-10 flex items-center justify-center gap-2 pointer-events-none">
      {children}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className={`${base} ${sizeClass} ${widthClass} ${className}`} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizeClass} ${widthClass} ${className}`}
      style={style}
    >
      {content}
    </button>
  );
}
