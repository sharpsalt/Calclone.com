import { format, parse } from 'date-fns';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, Globe, Video } from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useBookingStore } from '../stores/bookingStore';

export function BookingDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { bookings, fetchBookingById } = useBookingStore();

    const booking = useMemo(() => bookings.find((item) => item.id === id), [bookings, id]);

    useEffect(() => {
        if (!booking && id) {
            void fetchBookingById(id);
        }
    }, [booking, fetchBookingById, id]);

    if (!booking) {
        return (
            <Shell>
                <Card>
                    <div className="py-8 text-center text-cal-text-muted">Booking not found.</div>
                </Card>
            </Shell>
        );
    }

    const dateLabel = format(new Date(`${booking.date}T00:00:00`), 'EEEE, d MMMM yyyy');
    const startLabel = format(parse(booking.startTime, 'HH:mm', new Date()), 'h:mma').toLowerCase();
    const endLabel = format(parse(booking.endTime, 'HH:mm', new Date()), 'h:mma').toLowerCase();

    return (
        <Shell>
            <div className="mb-4 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/bookings')}
                    className="rounded-lg p-2 text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary"
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-[1.75rem] font-semibold tracking-tight text-cal-text-primary">Booking details</h1>
            </div>

            <Card>
                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold text-cal-text-primary">{booking.eventTitle}</h2>
                        <p className="text-cal-text-default">You and {booking.bookerName}</p>
                        <p className="text-cal-text-muted">{booking.bookerEmail}</p>
                        <p className="text-sm text-cal-text-muted">UID: {booking.id}</p>
                    </div>

                    <div className="space-y-3 text-cal-text-default">
                        <div className="inline-flex items-center gap-2">
                            <CalendarDays size={16} />
                            {dateLabel}
                        </div>
                        <div className="inline-flex items-center gap-2">
                            <Clock3 size={16} />
                            {startLabel} - {endLabel}
                        </div>
                        <div className="inline-flex items-center gap-2">
                            <Globe size={16} />
                            {booking.location || 'Cal Video'}
                        </div>
                        <div className="inline-flex items-center gap-2">
                            <Video size={16} />
                            {booking.duration} mins
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={() => navigate(`/bookings/${booking.id}/join`)}>
                        Join Cal Video
                    </Button>
                </div>
            </Card>
        </Shell>
    );
}
