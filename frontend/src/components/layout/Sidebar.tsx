import { NavLink } from 'react-router-dom';
import {
    Link as LinkIcon,
    Calendar,
    Clock,
    ExternalLink,
    ChevronDown,
    Search,
    Gift,
} from 'lucide-react';
import { defaultUser } from '../../data/seed';
import { getInitials, cn } from '../../lib/utils';

const MAIN_NAV = [
    { name: 'Event types', href: '/event-types', icon: LinkIcon },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Availability', href: '/availability', icon: Clock },
];

export function Sidebar() {
    return (
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-cal-border bg-cal-bg-surface lg:flex">
            <div className="flex h-full w-full flex-col px-4 py-5">
                <div className="mb-6 flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cal-bg-emphasis text-xs font-semibold text-cal-text-primary ring-1 ring-white/10">
                        {getInitials(defaultUser.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-cal-text-primary">{defaultUser.name}</div>
                    </div>
                    <ChevronDown size={14} className="text-cal-text-dimmed" />
                    <Search size={16} className="text-cal-text-dimmed" />
                </div>

                <nav className="space-y-1">
                    {MAIN_NAV.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors',
                                    isActive
                                        ? 'bg-white/12 text-cal-text-primary'
                                        : 'text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary'
                                )
                            }
                        >
                            <item.icon size={17} strokeWidth={2.1} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto space-y-1 pt-6">
                    <a
                        href={`/${defaultUser.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <ExternalLink size={17} strokeWidth={2.1} />
                        View public page
                    </a>
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <LinkIcon size={17} strokeWidth={2.1} />
                        Copy public page link
                    </button>
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <Gift size={17} strokeWidth={2.1} />
                        Refer and earn
                    </button>
                </div>
            </div>
        </aside>
    );
}
