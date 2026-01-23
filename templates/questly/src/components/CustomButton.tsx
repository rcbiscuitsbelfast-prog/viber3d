import { ReactNode } from 'react';

interface CustomButtonProps {
  onClick?: () => void;
  children: ReactNode;
  size?: 'small' | 'large';
  disabled?: boolean;
  className?: string;
}

export default function CustomButton({
  onClick,
  children,
  size = 'large',
  disabled = false,
  className = '',
}: CustomButtonProps) {
  const isSmall = size === 'small';

  if (isSmall) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative inline-flex items-center justify-center gap-2
          px-6 py-3 min-h-[44px]
          bg-primary text-primary-foreground
          border-b-4 border-primary/70
          rounded-lg font-bold text-sm
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150 
          active:translate-y-1 active:border-b-2
          hover:bg-primary/90 hover:scale-105
          shadow-lg hover:shadow-xl
          ${className}
        `}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center justify-center gap-3
        px-12 py-6 min-h-[100px] w-full max-w-md
        bg-primary text-primary-foreground
        border-b-8 border-primary/70
        rounded-2xl font-bold text-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150 
        active:translate-y-2 active:border-b-4
        hover:bg-primary/90 hover:scale-105
        shadow-2xl hover:shadow-3xl
        ${className}
      `}
    >
      {children}
    </button>
  );
}
