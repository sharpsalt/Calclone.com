import { Plus, Ellipsis, Copy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '../components/ui/Dialog';
import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAvailabilityStore } from '../stores/availabilityStore';
import api from '../lib/api';

const TIMEZONES = [
    'UTC',
    'America/Los_Angeles',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney',
    'America/Chicago',
    'America/Denver',
];


type TeamMember = { id: string; name: string; timezone: string };

export function AvailabilityPage() {
    const { availability, updateAvailability } = useAvailabilityStore();
    const [showNewSchedule, setShowNewSchedule] = useState(false);
    const [newScheduleName, setNewScheduleName] = useState('Working hours');
    const [newScheduleTz, setNewScheduleTz] = useState(availability.timezone);
    const [schedules, setSchedules] = useState<any[]>([]);

    const [activeView, setActiveView] = useState<'personal' | 'team'>('personal');
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
        try { return JSON.parse(localStorage.getItem('teamMembers') || '[]'); } catch { return []; }
    });
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberTz, setNewMemberTz] = useState(availability.timezone || 'UTC');
    const [showRedirectDialog, setShowRedirectDialog] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState(() => { try { return localStorage.getItem('ooRedirect') || ''; } catch { return ''; } });

    useEffect(() => {
        try { localStorage.setItem('teamMembers', JSON.stringify(teamMembers)); } catch {}
    }, [teamMembers]);

    const loadSchedules = async () => {
        try {
            const rows = await api.fetchSchedules();
            // hide default (non-deletable) schedules from the list to avoid confusion
            setSchedules(Array.isArray(rows) ? rows.filter((r: any) => !Boolean(r.is_default)) : []);
        } catch (err) {
            console.error('fetch schedules error', err);
            setSchedules([]);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, []);

    const navigate = useNavigate();

    function ScheduleItem({ sch }: { sch: any }) {
        const [menuOpen, setMenuOpen] = useState(false);
        const menuRef = useRef<HTMLDivElement | null>(null);
        useEffect(() => {
            function handler(e: MouseEvent) {
                const t = e.target as Node;
                if (!menuOpen) return;
                if (menuRef.current && menuRef.current.contains(t)) return;
                setMenuOpen(false);
            }
            document.addEventListener('mousedown', handler);
            return () => document.removeEventListener('mousedown', handler);
        }, [menuOpen]);

        return (
            <div
                role={sch.is_default ? undefined : 'button'}
                tabIndex={sch.is_default ? undefined : 0}
                onClick={() => { if (!sch.is_default) navigate(`/availability/schedules/${sch.id}`); }}
                className={`flex items-center justify-between rounded-md border border-cal-border p-4 relative ${!sch.is_default ? 'cursor-pointer' : ''}`}
            >
                <div>
                    <div className="font-medium text-cal-text-primary">{sch.name}</div>
                    <div className="text-xs text-cal-text-muted">{sch.timezone}</div>
                </div>

                <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/availability/schedules/${sch.id}`); }} className="inline-flex items-center gap-2 text-sm font-medium text-cal-text-muted transition-colors hover:text-cal-text-primary">
                        Open
                    </button>
                    <div className="relative">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted hover:bg-white/5">
                            <Ellipsis size={16} />
                        </button>
                        {menuOpen && (
                            <div ref={menuRef} onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-40 rounded-md bg-cal-bg-card border border-cal-border shadow-lg z-50">
                                <button className="w-full text-left px-3 py-2 text-sm hover:bg-cal-bg-subtle" onClick={async () => {
                                    try {
                                        const row = await api.fetchSchedule(sch.id);
                                        const copyName = `${sch.name} (copy)`;
                                        await api.createSchedule({ name: copyName, timezone: sch.timezone, timeRanges: row.timeRanges || [] });
                                        await loadSchedules();
                                    } catch (err) { console.error('duplicate schedule failed', err); }
                                    setMenuOpen(false);
                                }}>
                                    <div className="flex items-center gap-2"><Copy size={14} /> Duplicate</div>
                                </button>
                                <button
                                    disabled={Boolean(sch.is_default)}
                                    className={`w-full text-left px-3 py-2 text-sm ${sch.is_default ? 'text-cal-text-muted' : 'text-cal-error hover:bg-cal-bg-subtle'}`}
                                    onClick={async () => {
                                        if (sch.is_default) {
                                            setMenuOpen(false);
                                            alert('Cannot delete the default schedule');
                                            return;
                                        }
                                        if (!confirm('Delete this schedule?')) return;
                                        try {
                                            await api.deleteSchedule(sch.id);
                                            await loadSchedules();
                                        } catch (err: any) {
                                            console.error('delete schedule failed', err);
                                            alert(err?.message || 'Failed to delete schedule');
                                        }
                                        setMenuOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2">Delete</div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Inline schedule editing removed to match Cal.com UX.
    // Schedules are listed and can be duplicated/deleted from the menu.

    return (
        <Shell>
            <PageHeader
                title="Availability"
                subtitle="Configure times when you are available for bookings."
                actions={
                    <div className="inline-flex items-center rounded-xl border border-cal-border bg-cal-bg-subtle p-1 text-sm">
                        <button type="button" onClick={() => setActiveView('personal')} className={`rounded-lg px-3 py-2 font-medium ${activeView === 'personal' ? 'bg-white text-cal-text-inverted' : 'text-cal-text-muted'}`}>
                            My availability
                        </button>
                        <button type="button" onClick={() => setActiveView('team')} className={`rounded-lg px-3 py-2 ${activeView === 'team' ? 'bg-white text-cal-text-inverted' : 'text-cal-text-muted'}`}>
                            Team availability
                        </button>
                        <Button size="md" variant="accent" className="ml-3 rounded-full" onClick={() => setShowNewSchedule(true)}>+ New</Button>
                    </div>
                }
            />

            <Card noPadding className="overflow-hidden">
                {/* Listing view */}
                    <div className="px-6 py-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium">Schedules</h3>
                        </div>
                        {schedules.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-cal-border bg-cal-bg-subtle/70 px-4 py-6 text-sm text-cal-text-dimmed">No schedules yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {schedules.map((s) => (
                                    <ScheduleItem key={s.id} sch={s} />
                                ))}
                            </div>
                        )}
                    </div>

                {/* Inline schedule editor removed */}

                <div className="px-6 py-5 text-center text-sm text-cal-text-muted">
                    Temporarily out-of-office? <button onClick={() => navigate('/out-of-office')} className="text-cal-text-primary underline underline-offset-4">Add a redirect</button>
                </div>

                {activeView === 'team' && (
                    <div className="px-6 py-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium">Team members</h3>
                            <div>
                                <Button size="sm" variant="accent" onClick={() => setShowAddMember(true)} className="inline-flex items-center gap-2">
                                    <Plus size={14} /> Add member
                                </Button>
                            </div>
                        </div>

                        {teamMembers.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-cal-border bg-cal-bg-subtle/70 px-4 py-6 text-sm text-cal-text-dimmed">No team members yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {teamMembers.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between rounded-md border border-cal-border p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cal-bg-emphasis text-sm font-semibold">{m.name.split(' ').map((s) => s[0]).slice(0,2).join('')}</div>
                                            <div>
                                                <div className="font-medium text-cal-text-primary">{m.name}</div>
                                                <div className="text-xs text-cal-text-muted">{m.timezone}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button className="text-sm text-cal-text-muted" onClick={() => { setTeamMembers(teamMembers.filter((t) => t.id !== m.id)); }}>Remove</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* per-day schedule editor removed from the list page */}

                    
            </Card>

            <Dialog open={showNewSchedule} onClose={() => setShowNewSchedule(false)} title="Add a new schedule">
                <div className="space-y-3">
                    <label className="text-sm text-cal-text-muted">Name</label>
                    <Input value={newScheduleName} onChange={(e) => setNewScheduleName(e.target.value)} />
                    <label className="text-sm text-cal-text-muted">Timezone</label>
                    <select value={newScheduleTz} onChange={(e) => setNewScheduleTz(e.target.value)} className="mt-2 w-full rounded-md border border-cal-border px-3 py-2 bg-cal-bg-surface">
                        {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                        <div className="flex justify-end gap-2">
                        <button onClick={() => setShowNewSchedule(false)} className="text-sm text-cal-text-muted">Close</button>
                        <Button onClick={async () => {
                            try {
                                await api.createSchedule({ name: newScheduleName, timezone: newScheduleTz, timeRanges: [] });
                                await loadSchedules();
                            } catch (err) {
                                console.error('create schedule failed', err);
                            }
                            updateAvailability({ name: newScheduleName, timezone: newScheduleTz });
                            setShowNewSchedule(false);
                        }}>Continue</Button>
                    </div>
                </div>
            </Dialog>

            <Dialog open={showAddMember} onClose={() => setShowAddMember(false)} title="Add team member">
                <div className="space-y-3">
                    <label className="text-sm text-cal-text-muted">Name</label>
                    <Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
                    <label className="text-sm text-cal-text-muted">Timezone</label>
                    <select value={newMemberTz} onChange={(e) => setNewMemberTz(e.target.value)} className="mt-2 w-full rounded-md border border-cal-border px-3 py-2 bg-cal-bg-surface">
                        {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddMember(false)} className="text-sm text-cal-text-muted">Cancel</button>
                        <Button onClick={() => {
                            const id = Date.now().toString();
                            setTeamMembers([...teamMembers, { id, name: newMemberName || 'New Member', timezone: newMemberTz }]);
                            setNewMemberName('');
                            setNewMemberTz(availability.timezone || 'UTC');
                            setShowAddMember(false);
                        }}>Add</Button>
                    </div>
                </div>
            </Dialog>

            <Dialog open={showRedirectDialog} onClose={() => setShowRedirectDialog(false)} title="Out of office redirect">
                <div className="space-y-3">
                    <label className="text-sm text-cal-text-muted">Redirect URL</label>
                    <Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://example.com/away" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowRedirectDialog(false)} className="text-sm text-cal-text-muted">Cancel</button>
                        <Button onClick={() => { try { localStorage.setItem('ooRedirect', redirectUrl || ''); } catch {} setShowRedirectDialog(false); }}>Save</Button>
                    </div>
                </div>
            </Dialog>
        </Shell>
    );
}
