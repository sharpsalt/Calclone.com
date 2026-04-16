import { addMinutes, format, parse } from 'date-fns';
import { Check, ChevronLeft, ExternalLink } from 'lucide-react';
import type { EventType } from '../../types';

interface BookingConfirmationProps {
    eventType: EventType;
    selectedDate: Date | null;
    selectedTime: string | null;
    bookerName: string;
    bookerEmail: string;
    bookingId?: string;
    onBack?: () => void;
    onReschedule?: () => void;
    onCancel?: () => Promise<void> | void;
}

export function BookingConfirmation({
    eventType,
    selectedDate,
    selectedTime,
    bookerName,
    bookerEmail,
    bookingId,
    onBack,
    onReschedule,
    onCancel,
}: BookingConfirmationProps) {
    if (!selectedDate || !selectedTime) {
        return null;
    }

    const start = parse(selectedTime, 'HH:mm', new Date());
    const end = addMinutes(start, eventType.duration);

    return (
        <div className="min-h-screen bg-cal-bg-base px-4 py-8 sm:px-6">
            <div className="mx-auto w-full max-w-[760px]">
                <button
                    type="button"
                    onClick={() => {
                        if (typeof onBack === 'function') return onBack();
                        try { window.history.back(); } catch { /* noop */ }
                    }}
                    className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-cal-text-muted transition-colors hover:text-cal-text-primary"
                >
                    <ChevronLeft size={16} />
                    Back to bookings
                </button>

                <div className="mx-auto max-w-[590px] rounded-[28px] border border-cal-border bg-cal-bg-card px-8 py-10 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:px-10">
                    <div className="mb-10 flex flex-col items-center text-center">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cal-success-subtle text-cal-success">
                            <Check size={28} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-[2rem] font-semibold tracking-tight text-cal-text-primary">This meeting is scheduled</h1>
                        <p className="mt-3 max-w-[460px] text-lg leading-8 text-cal-text-default">
                            We sent an email with a calendar invitation with the details to everyone.
                        </p>
                    </div>

                    <div className="space-y-6 border-t border-cal-border pt-8">
                        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                            <div className="text-2xl font-medium text-cal-text-primary">What</div>
                            <div className="text-[1.05rem] leading-8 text-cal-text-default">{eventType.title} between {bookerName} and Srijan Verma</div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                            <div className="text-2xl font-medium text-cal-text-primary">When</div>
                            <div className="text-[1.05rem] leading-8 text-cal-text-default">
                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                <br />
                                {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                            <div className="text-2xl font-medium text-cal-text-primary">Who</div>
                            <div className="space-y-3 text-[1.05rem] leading-8 text-cal-text-default">
                                <div>
                                    Srijan Verma <span className="ml-2 rounded-md bg-[#243b87] px-2 py-1 text-xs font-semibold text-white">Host</span>
                                    <br />
                                    srijan@example.com
                                </div>
                                <div>
                                    {bookerName}
                                    <br />
                                    {bookerEmail}
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                            <div className="text-2xl font-medium text-cal-text-primary">Where</div>
                            <div className="inline-flex items-center gap-2 text-[1.05rem] text-cal-text-default">
                                Cal Video
                                <ExternalLink size={15} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 border-t border-cal-border pt-8 text-center text-lg text-cal-text-muted">
                        Need to make a change?{' '}
                        <button
                            type="button"
                            onClick={() => {
                                if (typeof onReschedule === 'function') return onReschedule();
                                if (bookingId) {
                                    try { window.location.href = `/bookings/${bookingId}`; } catch {}
                                }
                            }}
                            className="text-cal-text-primary underline underline-offset-4"
                        >
                            Reschedule
                        </button>{' '}
                        or{' '}
                        <button
                            type="button"
                            onClick={async () => {
                                if (typeof onCancel === 'function') {
                                    await onCancel();
                                    return;
                                }
                                if (bookingId) {
                                    try { await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' }); window.location.reload(); } catch {}
                                }
                            }}
                            className="text-cal-text-primary underline underline-offset-4"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
