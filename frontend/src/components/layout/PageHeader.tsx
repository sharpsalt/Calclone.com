import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
                <h1 className="text-3xl md:text-[2rem] font-semibold tracking-tight text-cal-text-primary">{title}</h1>
                {subtitle && (
                    <p className="mt-1 text-sm text-cal-text-muted">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
