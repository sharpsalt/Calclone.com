import { useState } from 'react';
import { Shell } from '../components/layout/Shell';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn, getInitials } from '../lib/utils';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
const PERSONAL_NAV = [
    { key: 'profile', label: 'Profile', to: 'profile' },
    { key: 'general', label: 'General', to: 'general' },
    { key: 'calendars', label: 'Calendars', to: 'calendars' },
    { key: 'conferencing', label: 'Conferencing', to: 'conferencing' },
    { key: 'appearance', label: 'Appearance', to: 'appearance' },
    { key: 'out-of-office', label: 'Out of office', to: 'out-of-office' },
    { key: 'push-notifications', label: 'Push notifications', to: 'push-notifications' },
    { key: 'features', label: 'Features', to: 'features' },
];

const SECURITY_NAV = [
    { key: 'password', label: 'Password', to: 'password' },
    { key: 'impersonation', label: 'Impersonation', to: 'impersonation' },
    { key: 'compliance', label: 'Compliance', to: 'compliance' },
];

const BILLING_NAV = [
    { key: 'manage-billing', label: 'Manage billing', to: 'manage-billing' },
    { key: 'plans', label: 'Plans', to: 'plans' },
];

const DEVELOPER_NAV = [
    { key: 'webhooks', label: 'Webhooks', to: 'webhooks' },
    { key: 'api-keys', label: 'API keys', to: 'api-keys' },
    { key: 'oauth-clients', label: 'OAuth Clients', to: 'oauth-clients' },
];

export function SettingsPage() {
    const user = useUserStore((s) => s.user);
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleBack = () => {
        try {
            if (window.history.length > 1) navigate(-1);
            else navigate('/');
        } catch (e) {
            navigate('/');
        }
    };
    const leftSidebar = (
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-cal-border bg-cal-bg-surface lg:flex">
            <div className="flex h-full w-full flex-col px-5 py-6">
                <div className="mb-4 relative">
                    <button onClick={handleBack} aria-label="Go back" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-white/6 transition-colors text-sm font-medium text-cal-text-primary">
                        <ArrowLeft size={16} className="text-cal-text-muted" />
                        <span>Back</span>
                    </button>
                </div>

                <div className="mb-6 flex items-center gap-3">
                    <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cal-bg-emphasis text-sm font-semibold text-cal-text-primary ring-1 ring-white/10">
                            {getInitials(user?.name ?? 'You')}
                        </div>
                    </div>

                    <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-cal-text-primary">{user?.name || 'You'}</div>
                    </div>
                </div>

                <nav className="mt-4">
                        <div className="px-3 mb-2">
                        <NavLink
                            to="/settings"
                            end
                            className={({ isActive }) =>
                                cn(
                                    'block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                    isActive ? 'bg-white/6 text-cal-text-primary ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]' : 'text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary'
                                )
                            }
                        >
                            Overview
                        </NavLink>
                    </div>

                    <div className="px-3 mt-4">
                        <div className="text-xs font-semibold text-cal-text-muted mb-2">Personal</div>
                        <div className="space-y-1">
                                    {PERSONAL_NAV.map((item) => (
                                        <NavLink
                                            key={item.key}
                                            to={item.to}
                                            className={({ isActive }) =>
                                                cn(
                                                    'block rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
                                                    isActive ? 'bg-white/6 text-cal-text-primary ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]' : 'text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary'
                                                )
                                            }
                                        >
                                            {item.label}
                                        </NavLink>
                                    ))}
                        </div>
                    </div>

                    <div className="px-3 mt-6">
                        <div className="text-xs font-semibold text-cal-text-muted mb-2">Security</div>
                        <div className="space-y-1">
                            {SECURITY_NAV.map((item) => (
                                <NavLink
                                    key={item.key}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        cn(
                                            'block rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
                                            isActive ? 'bg-white/6 text-cal-text-primary ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]' : 'text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary'
                                        )
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <div className="px-3 mt-6">
                        <div className="text-xs font-semibold text-cal-text-muted mb-2">Billing</div>
                        <div className="space-y-1">
                            {BILLING_NAV.map((item) => (
                                <NavLink
                                    key={item.key}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        cn(
                                            'block rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
                                            isActive ? 'bg-white/6 text-cal-text-primary ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]' : 'text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary'
                                        )
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <div className="px-3 mt-6">
                        <div className="text-xs font-semibold text-cal-text-muted mb-2">Developer</div>
                        <div className="space-y-1">
                            {DEVELOPER_NAV.map((item) => (
                                <NavLink
                                    key={item.key}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        cn(
                                            'block rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
                                            isActive ? 'bg-white/6 text-cal-text-primary ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]' : 'text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary'
                                        )
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="mt-auto" />
            </div>
        </aside>
    );

    return (
        <Shell left={leftSidebar}>
            <div className="">
                {/* Mobile header (shown only on small screens) */}
                <div className="lg:hidden">
                    <div className="px-4 py-3 border-b border-cal-border bg-cal-bg-surface">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={handleBack} aria-label="Go back" className="p-2 rounded-md text-cal-text-muted hover:bg-white/5">
                                    <ArrowLeft size={18} />
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-cal-bg-emphasis flex items-center justify-center text-sm font-semibold text-cal-text-primary">{getInitials(user?.name ?? 'You')}</div>
                                    <div className="text-sm font-medium text-cal-text-primary">{user?.name || 'You'}</div>
                                </div>
                            </div>

                            <button onClick={() => setMobileOpen((v) => !v)} aria-label="Open navigation" className="p-2 rounded-md text-cal-text-muted hover:bg-white/5">
                                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>
                        </div>

                        {mobileOpen && (
                            <div className="mt-3">
                                <nav className="space-y-2">
                                    <NavLink to="/settings" end onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('block rounded-md px-3 py-2 text-sm', isActive ? 'bg-white/6 text-cal-text-primary' : 'text-cal-text-muted')}>Overview</NavLink>

                                    <div className="pt-2 text-xs font-semibold text-cal-text-muted">Personal</div>
                                    {PERSONAL_NAV.map((item) => (
                                        <NavLink key={item.key} to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('block rounded-md px-3 py-2 text-sm', isActive ? 'bg-white/6 text-cal-text-primary' : 'text-cal-text-muted')}>
                                            {item.label}
                                        </NavLink>
                                    ))}

                                    <div className="pt-2 text-xs font-semibold text-cal-text-muted">Security</div>
                                    {SECURITY_NAV.map((item) => (
                                        <NavLink key={item.key} to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('block rounded-md px-3 py-2 text-sm', isActive ? 'bg-white/6 text-cal-text-primary' : 'text-cal-text-muted')}>
                                            {item.label}
                                        </NavLink>
                                    ))}

                                    <div className="pt-2 text-xs font-semibold text-cal-text-muted">Billing</div>
                                    {BILLING_NAV.map((item) => (
                                        <NavLink key={item.key} to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('block rounded-md px-3 py-2 text-sm', isActive ? 'bg-white/6 text-cal-text-primary' : 'text-cal-text-muted')}>
                                            {item.label}
                                        </NavLink>
                                    ))}

                                    <div className="pt-2 text-xs font-semibold text-cal-text-muted">Developer</div>
                                    {DEVELOPER_NAV.map((item) => (
                                        <NavLink key={item.key} to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('block rounded-md px-3 py-2 text-sm', isActive ? 'bg-white/6 text-cal-text-primary' : 'text-cal-text-muted')}>
                                            {item.label}
                                        </NavLink>
                                    ))}
                                </nav>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <Outlet />
                </div>
            </div>
        </Shell>
    );
}

export default SettingsPage;
