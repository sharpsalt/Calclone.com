import { cn } from '../../lib/utils';

interface Tab {
    id: string;
    label: string;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
    counts?: Record<string, number>;
}

export function Tabs({ tabs, activeTab, onChange, className, counts }: TabsProps) {
    return (
        <div className={cn('inline-flex items-center gap-1 rounded-xl border border-cal-border bg-cal-bg-subtle/70 p-1', className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        'rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-200 relative cursor-pointer',
                        activeTab === tab.id
                            ? 'bg-white text-cal-text-inverted shadow-sm'
                            : 'text-cal-text-muted hover:text-cal-text-default hover:bg-white/5'
                    )}
                >
                    {tab.label}
                    {(tab.count !== undefined || counts?.[tab.id] !== undefined) && (
                        <span
                            className={cn(
                                'ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]',
                                activeTab === tab.id
                                    ? 'bg-black/10 text-cal-text-inverted'
                                    : 'bg-white/6 text-cal-text-muted'
                            )}
                        >
                            {tab.count ?? counts?.[tab.id]}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
