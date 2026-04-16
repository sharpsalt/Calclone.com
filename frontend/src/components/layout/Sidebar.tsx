import { NavLink, Link } from 'react-router-dom';
import {
    Link as LinkIcon,
    Calendar,
    Clock,
    ExternalLink,
    ChevronDown,
    Search,
    Gift,
    User,
    Settings,
    Moon,
    Map,
    HelpCircle,
    DownloadCloud,
} from 'lucide-react';
import { defaultUser } from '../../data/seed';
import { getInitials, cn } from '../../lib/utils';
import { useUserStore } from '../../stores/userStore';
import { useSearchStore } from '../../stores/searchStore';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../ui/Dialog';

const MAIN_NAV = [
    { name: 'Event types', href: '/event-types', icon: LinkIcon },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Availability', href: '/availability', icon: Clock },
];

export function Sidebar() {
    const user = useUserStore((s) => s.user);
    const updateUser = useUserStore((s) => s.updateUser);
    const [open, setOpen] = useState(false);
    const [showOutOfOffice, setShowOutOfOffice] = useState(false);
    const [copiedPublicLink, setCopiedPublicLink] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const setSearchOpen = useSearchStore((s) => s.setOpen);
    const presence = (user?.presence ?? (user?.online ? 'available' : 'offline')) as 'available' | 'busy' | 'away' | 'offline';
    const publicUsername = defaultUser.username;
    const publicUrl = `${window.location.origin}/${publicUsername}`;

    function presenceLabel(p: 'available' | 'busy' | 'away' | 'offline') {
        switch (p) {
            case 'available':
                return 'Available';
            case 'busy':
                return 'Busy';
            case 'away':
                return 'Away';
            default:
                return 'Offline';
        }
    }

    function presenceClass(p: 'available' | 'busy' | 'away' | 'offline') {
        switch (p) {
            case 'available':
                return 'bg-emerald-400';
            case 'busy':
                return 'bg-red-500';
            case 'away':
                return 'bg-amber-400';
            default:
                return 'bg-gray-400';
        }
    }

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!open) return;
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return;
            if (menuRef.current && !menuRef.current.contains(target)) setOpen(false);
        }

        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }

        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const [ooRedirect, setOoRedirect] = useState(() => {
        try { return localStorage.getItem('ooRedirect') || ''; } catch { return ''; }
    });

    function saveOutOfOffice() {
        try { localStorage.setItem('ooRedirect', ooRedirect || ''); } catch {}
        setShowOutOfOffice(false);
    }

    async function copyPublicPageLink() {
        try {
            await navigator.clipboard.writeText(publicUrl);
            setCopiedPublicLink(true);
            window.setTimeout(() => setCopiedPublicLink(false), 2000);
        } catch {
            setCopiedPublicLink(false);
        }
    }

    return (
        <>
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-cal-border bg-cal-bg-surface lg:flex">
                <div className="flex h-full w-full flex-col px-5 py-6">
                    <div className="mb-6 relative">
                        <div className="flex items-center gap-2">
                                <button
                                    ref={btnRef}
                                    type="button"
                                    onClick={() => setOpen((v) => !v)}
                                    className="flex-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-white/6 transition-colors"
                                    aria-expanded={open}
                                >
                                    <div className="relative">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cal-bg-emphasis text-sm font-semibold text-cal-text-primary ring-1 ring-white/10">
                                            {getInitials(user?.name ?? defaultUser.name)}
                                        </div>
                                        <span
                                            className={`absolute -bottom-0 -left-0 h-3 w-3 rounded-full ${presenceClass(presence)} ring-2 ring-white/10`}
                                            title={presenceLabel(presence)}
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-cal-text-primary">{user?.name ?? defaultUser.name}</div>
                                    </div>

                                    <ChevronDown size={14} className="text-cal-text-dimmed" />
                                </button>

                            <button
                                type="button"
                                aria-label="Search"
                                onClick={() => setSearchOpen(true)}
                                className="p-2 rounded-md hover:bg-white/5 text-cal-text-dimmed"
                            >
                                <Search size={16} />
                            </button>
                        </div>

                        {open && (
                            <div ref={menuRef} className="absolute left-0 mt-3 w-64 cal-card rounded-2xl overflow-hidden bg-cal-bg-card p-3 shadow-[0_12px_40px_rgba(2,6,23,0.5)]">
                                <div className="px-3 py-3">
                                    <div className="flex items-center gap-3 px-2 py-1">
                                        <span className={`h-3 w-3 rounded-full ${presenceClass(presence)} ring-2 ring-white/10`} title={presenceLabel(presence)} />
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-cal-text-primary truncate">{user?.name ?? defaultUser.name}</div>
                                            <div className="text-xs text-cal-text-dimmed">{presenceLabel(presence)}</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button type="button" onClick={() => { updateUser({ presence: 'available', online: true }); setOpen(false); }} className="rounded-full px-3 py-1 text-sm hover:bg-cal-bg-subtle w-full text-left">Available</button>
                                        <button type="button" onClick={() => { updateUser({ presence: 'busy', online: false }); setOpen(false); }} className="rounded-full px-3 py-1 text-sm hover:bg-cal-bg-subtle w-full text-left">Busy</button>
                                        <button type="button" onClick={() => { updateUser({ presence: 'away', online: false }); setOpen(false); }} className="rounded-full px-3 py-1 text-sm hover:bg-cal-bg-subtle w-full text-left">Away</button>
                                        <button type="button" onClick={() => { updateUser({ presence: 'offline', online: false }); setOpen(false); }} className="rounded-full px-3 py-1 text-sm hover:bg-cal-bg-subtle w-full text-left">Offline</button>
                                    </div>
                                </div>

                                <div className="my-2 border-t border-cal-border" />

                                <Link to={`/${publicUsername}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle">
                                    <User size={16} />
                                    <span>My profile</span>
                                </Link>

                                <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle">
                                    <Settings size={16} />
                                    <span>My settings</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        try {
                                            localStorage.removeItem('greetingSeen');
                                            document.dispatchEvent(new Event('showGreeting'));
                                        } catch (e) {}
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle w-full text-left"
                                >
                                    <HelpCircle size={16} />
                                    <span>Show greeting again</span>
                                </button>

                                <button type="button" onClick={() => { setOpen(false); setShowOutOfOffice(true); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle w-full text-left">
                                    <Moon size={16} />
                                    <span>Out of office</span>
                                </button>

                                <div className="my-2 border-t border-cal-border" />

                                <Link to="/roadmap" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle w-full text-left">
                                    <Map size={16} />
                                    <span>Roadmap</span>
                                </Link>

                                <Link to="/help" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle w-full text-left">
                                    <HelpCircle size={16} />
                                    <span>Help</span>
                                </Link>

                                <a href="#" className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle">
                                    <span className="flex items-center gap-2">
                                        <DownloadCloud size={16} />
                                        <span>Download app</span>
                                    </span>
                                    <ExternalLink size={14} />
                                </a>

                                <div className="my-2 border-t border-cal-border" />
                            </div>
                        )}
                    </div>

                    <nav className="mt-4 space-y-1">
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
                            href={`/${publicUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                        >
                            <ExternalLink size={17} strokeWidth={2.1} />
                            View public page
                        </a>
                        <button
                            type="button"
                            onClick={copyPublicPageLink}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                        >
                            <LinkIcon size={17} strokeWidth={2.1} />
                            {copiedPublicLink ? 'Copied public page link' : 'Copy public page link'}
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

            <Dialog open={showOutOfOffice} onClose={() => setShowOutOfOffice(false)} title="Out of office">
                <div className="space-y-4">
                    <p className="text-sm text-cal-text-muted">Temporarily redirect visitors while you're away. Enter a URL to redirect public pages.</p>
                    <input value={ooRedirect} onChange={(e) => setOoRedirect(e.target.value)} placeholder="https://example.com/redirect" className="w-full rounded-md border border-cal-border px-3 py-2" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowOutOfOffice(false)} className="text-sm text-cal-text-muted">Cancel</button>
                        <button onClick={saveOutOfOffice} className="rounded-md bg-cal-bg-emphasis px-3 py-2 text-sm text-white">Save</button>
                    </div>
                </div>
            </Dialog>
        </>
    );
}

// Out of office dialog is rendered inside Sidebar component via state.
