import { cn } from '../../lib/utils';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: ReactNode;
    icon?: ReactNode;
    loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-white text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300 font-semibold shadow-[0_10px_24px_rgba(255,255,255,0.08)]',
    secondary:
        'bg-zinc-800 text-zinc-100 border border-transparent hover:bg-zinc-700 active:bg-zinc-600 font-medium shadow-sm',
    ghost:
        'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5 active:bg-white/10 font-medium transition-colors',
    outline:
        'bg-transparent text-zinc-200 border border-white/10 hover:border-white/20 hover:bg-white/5 font-medium shadow-sm',
    destructive:
        'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 font-medium',
    accent:
        'bg-cal-bg-emphasis text-white hover:opacity-95 active:opacity-90 font-semibold shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-sm gap-2',
};

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    className,
    disabled,
    loading,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-[var(--radius-cal-sm)] transition-all duration-200 cursor-pointer select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cal-bg-base)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
}
