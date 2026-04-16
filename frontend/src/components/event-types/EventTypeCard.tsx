import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Copy, Ellipsis, ExternalLink, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useEventTypeStore } from '../../stores/eventTypeStore';
import { defaultUser } from '../../data/seed';
import { Switch } from '../ui/Switch';

interface EventTypeCardProps {
    id: string;
    title: string;
    slug: string;
    duration: number;
    isActive: boolean;
    index?: number;
    totalCount?: number;
}

export function EventTypeCard({
    id,
    title,
    slug,
    duration,
    isActive,
    index = 0,
    totalCount = 1,
}: EventTypeCardProps) {
    const { updateEventType, deleteEventType, addEventType } = useEventTypeStore();
    // subscribe to latest event type from the store to ensure UI reflects updates
    const fromStore = useEventTypeStore((s) => s.eventTypes.find((et) => et.id === id));
    const current = fromStore ?? { id, title, slug, duration, isActive };
    useEffect(() => {
        // debug mount/update
        // eslint-disable-next-line no-console
        console.debug('[EventTypeCard] render', { id, current });
    }, [id, current]);
    const navigate = useNavigate();
    const moveUp = useEventTypeStore((s) => s.moveEventTypeUp);
    const moveDown = useEventTypeStore((s) => s.moveEventTypeDown);
    const publicLink = `/${defaultUser.username}/${current.slug}`;
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showEmbed, setShowEmbed] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            const target = e.target as Node;
            if (!menuOpen) return;
            if (menuRef.current && menuRef.current.contains(target)) return;
            if (menuButtonRef.current && menuButtonRef.current.contains(target)) return;
            setMenuOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    useEffect(() => {
        if (!menuOpen) {
            setMenuPos(null);
            return;
        }
        const btn = menuButtonRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const width = 220;
        const left = Math.max(8, rect.right - width + window.scrollX);
        const top = rect.bottom + 8 + window.scrollY;
        setMenuPos({ top, left, width });
    }, [menuOpen]);

    return (
        <div className="group flex flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center">
                    {index === 0 ? (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); try { console.debug('[EventTypeCard] moveDown', id); moveDown(id); } catch (err) { console.error(err); } }}
                                title="Move down"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                            >
                                <ArrowDown size={14} />
                            </button>
                    ) : index === totalCount - 1 ? (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); try { console.debug('[EventTypeCard] moveUp', id); moveUp(id); } catch (err) { console.error(err); } }}
                            title="Move up"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                        >
                            <ArrowUp size={14} />
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); try { console.debug('[EventTypeCard] moveUp', id); moveUp(id); } catch (err) { console.error(err); } }}
                                title="Move up"
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                            >
                                <ArrowUp size={12} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); try { console.debug('[EventTypeCard] moveDown', id); moveDown(id); } catch (err) { console.error(err); } }}
                                title="Move down"
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                            >
                                <ArrowDown size={12} />
                            </button>
                        </div>
                    )}
                </div>

            
            
            
                
                <div
                    className="min-w-0 flex-1 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/event-types/${id}`)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            navigate(`/event-types/${id}`);
                        }
                    }}
                >
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[1.35rem] font-semibold tracking-tight text-cal-text-primary">{current.title}</h3>
                    <Link
                        to={`/${defaultUser.username}/${current.slug}`}
                        target="_blank"
                        onClick={(event) => event.stopPropagation()}
                        className="truncate text-sm text-cal-text-muted transition-colors hover:text-cal-text-primary"
                    >
                        {defaultUser.username}/{current.slug}
                    </Link>
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/7 px-2 py-1 text-xs font-semibold text-cal-text-default">
                        <Clock size={12} />
                        {current.duration}m
                    </span>
                    {!current.isActive && (
                        <span className="rounded-full border border-cal-border bg-white/4 px-2.5 py-1 text-xs font-semibold text-cal-text-muted">
                            Hidden
                        </span>
                    )}
                </div>
            </div>
            </div>

            <div className="flex items-center justify-between gap-3 md:justify-end">
                <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                        checked={current.isActive}
                        onChange={async (checked) => {
                            // log and call update
                            try {
                                // eslint-disable-next-line no-console
                                console.debug('[EventTypeCard] toggle', { id, checked });
                                await updateEventType(id, { isActive: checked });
                                // eslint-disable-next-line no-console
                                console.debug('[EventTypeCard] toggle success', id);
                            } catch (err) {
                                // eslint-disable-next-line no-console
                                console.error('[EventTypeCard] toggle error', err);
                                window.alert('Toggle failed: ' + ((err as any)?.message || String(err)));
                            }
                        }}
                    />
                </div>
                <div className="flex items-center gap-2 relative">
                    <button
                        type="button"
                        title="Open public page (overlay)"
                        onClick={(e) => { e.stopPropagation(); try { console.debug('[EventTypeCard] openPublic', { id, publicLink }); window.open(`${window.location.origin}${publicLink}?overlayCalendar=true`, '_blank'); } catch (err) { console.error(err); } }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button
                        type="button"
                        title={copied ? 'Copied' : 'Copy link'}
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                // eslint-disable-next-line no-console
                                console.debug('[EventTypeCard] copyLink', { id, publicLink });
                                await navigator.clipboard.writeText(`${window.location.origin}${publicLink}`);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            } catch (err) {
                                console.error(err);
                            }
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>

                    <div className="relative">
                        <button
                            ref={menuButtonRef}
                            type="button"
                            aria-expanded={menuOpen}
                            onClick={(e) => { e.stopPropagation(); try { console.debug('[EventTypeCard] menu toggle', id); setMenuOpen((v) => !v); setShowEmbed(false); } catch (err) { console.error(err); } }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                        >
                            <Ellipsis size={16} />
                        </button>

                        {menuOpen && menuPos && createPortal(
                            <div ref={menuRef} style={{ position: 'absolute', top: menuPos.top, left: menuPos.left, width: menuPos.width }} className="cal-card p-2 shadow-[var(--shadow-cal)] z-50">
                                {!showEmbed ? (
                                    <>
                                        <button type="button" onClick={() => { const newTitle = prompt('Edit title', current.title); if (newTitle && newTitle.trim()) updateEventType(id, { title: newTitle.trim() }); setMenuOpen(false); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle w-full text-left">Edit</button>
                                        <button type="button" onClick={() => { addEventType({ title: `${current.title} (copy)`, slug: `${current.slug}-copy-${Math.random().toString(36).slice(2,6)}`, description: '', duration: current.duration, isActive: current.isActive }); setMenuOpen(false); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle w-full text-left">Duplicate</button>
                                        <button type="button" onClick={() => setShowEmbed(true)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle w-full text-left">Embed</button>
                                        <button type="button" onClick={() => { if (confirm('Delete this event type?')) { deleteEventType(id); } setMenuOpen(false); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cal-bg-subtle w-full text-left text-cal-error">Delete</button>
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="px-2 py-2 text-sm text-cal-text-dimmed">Embed link</div>
                                        <div className="flex items-center gap-2 px-2">
                                            <button title="Open overlay" onClick={() => window.open(`${window.location.origin}${publicLink}?overlayCalendar=true`, '_blank')} className="flex h-9 w-9 items-center justify-center rounded-md border border-cal-border text-cal-text-muted hover:bg-white/5"> <ExternalLink size={16} /> </button>
                                            <input readOnly value={`${window.location.origin}${publicLink}`} className="flex-1 rounded-md border border-cal-border px-2 py-1 text-sm bg-cal-bg-surface" />
                                            <button title="Copy" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}${publicLink}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {} }} className="flex h-9 w-9 items-center justify-center rounded-md border border-cal-border text-cal-text-muted hover:bg-white/5">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
                                        </div>
                                        <div className="flex justify-end px-2">
                                            <button type="button" onClick={() => setShowEmbed(false)} className="text-sm text-cal-text-dimmed">Back</button>
                                        </div>
                                    </div>
                                )}
                            </div>,
                            document.body
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
