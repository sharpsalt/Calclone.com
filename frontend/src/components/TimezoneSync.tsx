import { useEffect, useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { useAvailabilityStore } from '../stores/availabilityStore';
import { useUserStore } from '../stores/userStore';
import { defaultUser } from '../data/seed';

function readPersistedTimezone(key: string): string | undefined {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw);
        return (
            parsed?.state?.availability?.timezone ??
            parsed?.state?.user?.timezone ??
            parsed?.availability?.timezone ??
            parsed?.user?.timezone ??
            parsed?.timezone
        );
    } catch (e) {
        return undefined;
    }
}

export function TimezoneSync() {
    const availability = useAvailabilityStore((s) => s.availability);
    const updateAvailability = useAvailabilityStore((s) => s.updateAvailability);
    const user = useUserStore((s) => s.user);
    const updateUser = useUserStore((s) => s.updateUser);

    const [open, setOpen] = useState(false);
    const [checked, setChecked] = useState(false);
    const [serverStart, setServerStart] = useState<string | null>(null);

    const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        if (checked) return;

        let active = true;

        (async () => {
            // Try to fetch server start timestamp so we can show the prompt at most once per server boot.
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            let fetchedServerStart: string | null = null;
            try {
                const resp = await fetch(`${API_BASE}/api/server-info`, { cache: 'no-store' });
                if (resp.ok) {
                    const body = await resp.json();
                    fetchedServerStart = String(body?.server_start || body?.serverStart || '');
                    if (fetchedServerStart) setServerStart(fetchedServerStart);
                }
            } catch (e) {
                // ignore server-info errors; we'll fallback to session behavior
            }

            const persistedAvailTz = readPersistedTimezone('availability');
            const persistedUserTz = readPersistedTimezone('user');

            const currentAvailTz = persistedAvailTz ?? availability?.timezone;
            const currentUserTz = persistedUserTz ?? user?.timezone ?? defaultUser.timezone;

            // If we have a serverStart and we've already shown for this server boot, skip showing.
            try {
                if (fetchedServerStart) {
                    const lastSeen = localStorage.getItem('tz-sync:lastSeenServerStart');
                    if (lastSeen === fetchedServerStart) {
                        if (active) setChecked(true);
                        return;
                    }
                } else {
                    // Fallback: if we've shown in this browser session, don't show again on refresh
                    const shownThisSession = sessionStorage.getItem('tz-sync:shownThisSession');
                    if (shownThisSession) {
                        if (active) setChecked(true);
                        return;
                    }
                }
            } catch {}

            if ((currentAvailTz && currentAvailTz !== systemTz) || (currentUserTz && currentUserTz !== systemTz)) {
                if (active) setOpen(true);
            }

            if (active) setChecked(true);
        })();

        return () => {
            // cleanup
        };
    }, [availability, user, checked, systemTz]);

    const handleClose = () => {
        // mark that we've shown this prompt for the current server start (or at least this session)
        try {
            if (serverStart) {
                localStorage.setItem('tz-sync:lastSeenServerStart', serverStart);
            } else {
                sessionStorage.setItem('tz-sync:shownThisSession', '1');
            }
        } catch {}
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={handleClose} title="Want to update your timezone?">
            <div className="text-cal-text-default mb-6">
                It seems that your computer's timezone has changed to {systemTz}. It's very important to have the correct timezone to prevent bookings at the wrong time. Do you want us to update it?
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                    Don't update
                </Button>
                <Button
                    onClick={() => {
                        updateAvailability({ timezone: systemTz });
                        updateUser({ timezone: systemTz });
                        try {
                            if (serverStart) localStorage.setItem('tz-sync:lastSeenServerStart', serverStart);
                            else sessionStorage.setItem('tz-sync:shownThisSession', '1');
                        } catch {}
                        setOpen(false);
                    }}
                >
                    Update timezone
                </Button>
            </div>
        </Dialog>
    );
}
