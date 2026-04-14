import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
    count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'bg-cal-bg-subtle rounded-[var(--radius-cal-sm)] animate-pulse',
                        className
                    )}
                />
            ))}
        </>
    );
}
