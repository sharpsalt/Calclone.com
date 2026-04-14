import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'info';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    icon?: ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-cal-bg-subtle text-cal-text-muted border border-cal-border',
    success: 'bg-cal-success-subtle text-green-400 border border-green-800/40',
    warning: 'bg-cal-warning-subtle text-orange-400 border border-orange-800/40',
    info: 'bg-blue-950/60 text-blue-400 border border-blue-800/40',
};

export function Badge({ children, variant = 'default', icon, className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full tracking-wide',
                variantStyles[variant],
                className
            )}
        >
            {icon && <span className="flex-shrink-0 opacity-80">{icon}</span>}
            {children}
        </span>
    );
}
