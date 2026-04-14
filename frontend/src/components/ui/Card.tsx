import { cn } from '../../lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    noPadding?: boolean;
}

export function Card({ children, className, noPadding, ...props }: CardProps) {
    return (
        <div
            className={cn('cal-card', !noPadding && 'p-6 sm:p-7', className)}
            {...props}
        >
            {children}
        </div>
    );
}
