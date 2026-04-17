import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import * as api from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function ManageBookingPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');

    useEffect(() => {
        let active = true;
        async function load() {
            if (!token) return setError('Missing token');
            setLoading(true);
            try {
                const row = await api.publicGetBookingByToken(token);
                if (!active) return;
                setBooking(row);
            } catch (err: any) {
                setError(err?.message || 'Failed to load booking');
            } finally {
                if (active) setLoading(false);
            }
        }
        void load();
        return () => { active = false; };
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-cal-bg-base px-4 py-12">
                <div className="mx-auto max-w-2xl space-y-6">
                    <h1 className="text-2xl font-semibold"><Skeleton className="h-6 w-48 rounded-md" /></h1>
                    <div className="rounded-lg border bg-white/3 p-4">
                        <div className="mb-2 text-sm text-cal-text-muted"><Skeleton className="h-4 w-24 rounded-md" /></div>
                        <div className="text-lg font-medium"><Skeleton className="h-5 w-64 rounded-md" /></div>
                        <div className="mt-4 text-sm text-cal-text-muted"><Skeleton className="h-4 w-20 rounded-md" /></div>
                        <div className="text-lg"><Skeleton className="h-4 w-48 rounded-md" /></div>
                        <div className="mt-4 text-sm text-cal-text-muted"><Skeleton className="h-4 w-20 rounded-md" /></div>
                        <div className="text-lg"><Skeleton className="h-4 w-64 rounded-md" /></div>
                    </div>
                </div>
            </div>
        );
    }
    if (error) return <div className="p-8 text-red-600">{error}</div>;
    if (!booking) return <div className="p-8">Booking not found</div>;

    const start = booking.start_time ? booking.start_time.slice(0,5) : '';
    const dateStr = booking.date || booking.start_date || '';

    return (
        <div className="min-h-screen bg-cal-bg-base px-4 py-12">
            <div className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-semibold">Manage booking</h1>
                <div className="rounded-lg border bg-white/3 p-4">
                    <div className="mb-2 text-sm text-cal-text-muted">What</div>
                    <div className="text-lg font-medium">{booking.event_title || booking.title}</div>
                    <div className="mt-4 text-sm text-cal-text-muted">When</div>
                    <div className="text-lg">{dateStr ? format(parse(String(dateStr), 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d, yyyy') : ''} {start ? ` ${start}` : ''}</div>
                    <div className="mt-4 text-sm text-cal-text-muted">Who</div>
                    <div className="text-lg">{booking.booker_name} — {booking.booker_email}</div>
                    <div className="mt-4 flex gap-3">
                        <a href={`${API_BASE}/api/public/manage/${encodeURIComponent(token || '')}/ics`} className="rounded-md bg-cal-bg-emphasis px-3 py-2 text-sm text-white">Download .ics</a>
                        <Button onClick={async () => {
                            if (!token) return;
                            try {
                                await api.publicCancelByToken(token);
                                alert('Booking cancelled');
                                navigate(-1);
                            } catch (e) {
                                console.error(e);
                                alert('Cancel failed');
                            }
                        }}>Cancel booking</Button>
                    </div>
                </div>

                <div className="rounded-lg border bg-white/3 p-4">
                    <h2 className="text-lg font-medium">Reschedule</h2>
                    <p className="text-sm text-cal-text-muted">Choose a new date and time to reschedule this booking.</p>
                    <div className="mt-3 flex gap-2">
                        <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="rounded-md border px-2 py-1" />
                        <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="rounded-md border px-2 py-1" />
                        <Button onClick={async () => {
                            if (!token) return alert('Missing token');
                            if (!rescheduleDate || !rescheduleTime) return alert('Select date and time');
                            try {
                                const updated = await api.publicRescheduleByToken(token, rescheduleDate, rescheduleTime);
                                setBooking(updated);
                                alert('Rescheduled successfully');
                            } catch (err) {
                                console.error(err);
                                alert('Reschedule failed');
                            }
                        }}>Reschedule</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageBookingPage;
