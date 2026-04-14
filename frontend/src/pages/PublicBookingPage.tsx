import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addMinutes, format, getDay, parse } from 'date-fns';
import { Calendar, ChevronLeft, Clock, Globe, Video } from 'lucide-react';
import { defaultUser } from '../data/seed';
import { getInitials } from '../lib/utils';
import { useAvailabilityStore } from '../stores/availabilityStore';
import { useBookingStore } from '../stores/bookingStore';
import { useEventTypeStore } from '../stores/eventTypeStore';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { TimeSlotPicker } from '../components/booking/TimeSlotPicker';
import { BookingForm } from '../components/booking/BookingForm';
import { BookingConfirmation } from '../components/booking/BookingConfirmation';

type BookingStep = 'calendar' | 'form' | 'confirmation';

export function PublicBookingPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const eventType = useEventTypeStore((state) => state.getEventTypeBySlug(slug || ''));
    const { availability } = useAvailabilityStore();
    const { bookings, addBooking } = useBookingStore();

    const [step, setStep] = useState<BookingStep>('calendar');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [confirmedBooking, setConfirmedBooking] = useState<{ name: string; email: string } | null>(null);

    const timeRangesForDate = useMemo(() => {
        if (!selectedDate) {
            return [];
        }

        const daySchedule = availability.schedule.find((entry) => entry.day === getDay(selectedDate));
        return daySchedule?.enabled ? daySchedule.timeRanges : [];
    }, [availability, selectedDate]);

    if (!eventType) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cal-bg-base px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-cal-text-primary">Event not found</h1>
                    <button type="button" onClick={() => navigate(-1)} className="mt-3 text-sm text-cal-text-muted hover:text-cal-text-primary">
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'confirmation' && confirmedBooking && selectedDate && selectedTime) {
        return (
            <BookingConfirmation
                eventType={eventType}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                bookerName={confirmedBooking.name}
                bookerEmail={confirmedBooking.email}
            />
        );
    }

    const startTime = selectedTime ? parse(selectedTime, 'HH:mm', new Date()) : null;
    const endTime = startTime ? addMinutes(startTime, eventType.duration) : null;

    return (
        <div className="min-h-screen bg-cal-bg-base px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-[1160px]">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate(`/${defaultUser.username}`)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-cal-text-muted transition-colors hover:text-cal-text-primary"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    <div className="hidden items-center gap-2 md:flex">
                        <button type="button" className="rounded-xl border border-cal-border bg-white px-4 py-2 font-medium text-cal-text-inverted">
                            Need help?
                        </button>
                        <div className="inline-flex items-center rounded-xl border border-cal-border bg-cal-bg-card p-1">
                            <button type="button" className="rounded-lg p-2 text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary">
                                <Calendar size={16} />
                            </button>
                            <button type="button" className="rounded-lg p-2 text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary">
                                <Clock size={16} />
                            </button>
                            <button type="button" className="rounded-lg p-2 text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary">
                                <Video size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-cal-border bg-cal-bg-card shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                    <div className="grid min-h-[620px] lg:grid-cols-[320px_minmax(0,1fr)]">
                        <aside className="border-b border-cal-border px-7 py-7 lg:border-b-0 lg:border-r">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-semibold text-white">
                                    {getInitials(defaultUser.name)}
                                </div>
                                <div className="text-lg font-medium text-cal-text-muted">{defaultUser.name}</div>
                            </div>

                            <h1 className="mt-6 text-[2.15rem] font-semibold tracking-tight text-cal-text-primary">{eventType.title}</h1>

                            <div className="mt-7 space-y-4 text-cal-text-default">
                                <div className="flex items-center gap-3 text-lg">
                                    <Clock size={18} className="text-cal-text-muted" />
                                    {eventType.duration}m
                                </div>
                                <div className="flex items-center gap-3 text-lg">
                                    <Video size={18} className="text-cal-text-muted" />
                                    Cal Video
                                </div>
                                <div className="flex items-center gap-3 text-lg">
                                    <Globe size={18} className="text-cal-text-muted" />
                                    {availability.timezone}
                                </div>
                                {selectedDate && selectedTime && startTime && endTime && (
                                    <div className="rounded-2xl border border-[#0ea5e9]/20 bg-[#0ea5e9]/10 px-4 py-4 text-[#dbeafe]">
                                        <div className="flex items-start gap-3">
                                            <Calendar size={18} className="mt-1 text-[#38bdf8]" />
                                            <div className="text-base leading-7">
                                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                                <br />
                                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>

                        <section className="px-6 py-7 sm:px-8">
                            {step === 'form' && selectedDate && selectedTime ? (
                                <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
                                    <div className="hidden lg:block" />
                                    <BookingForm
                                        eventType={eventType}
                                        selectedDate={selectedDate}
                                        selectedTime={selectedTime}
                                        onBack={() => setStep('calendar')}
                                        onConfirm={(data) => {
                                            const end = format(addMinutes(parse(selectedTime, 'HH:mm', new Date()), eventType.duration), 'HH:mm');
                                            addBooking({
                                                eventTypeId: eventType.id,
                                                eventTitle: eventType.title,
                                                date: format(selectedDate, 'yyyy-MM-dd'),
                                                startTime: selectedTime,
                                                endTime: end,
                                                duration: eventType.duration,
                                                bookerName: data.name,
                                                bookerEmail: data.email,
                                                notes: data.notes || undefined,
                                                status: 'upcoming',
                                            });
                                            setConfirmedBooking({ name: data.name, email: data.email });
                                            setStep('confirmation');
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
                                    <BookingCalendar
                                        selectedDate={selectedDate}
                                        onSelectDate={(date) => {
                                            setSelectedDate(date);
                                            setSelectedTime(null);
                                        }}
                                        availability={availability}
                                    />
                                    {selectedDate ? (
                                        <TimeSlotPicker
                                            selectedDate={selectedDate}
                                            timeRanges={timeRangesForDate}
                                            duration={eventType.duration}
                                            existingBookings={bookings}
                                            selectedSlot={selectedTime}
                                            onSelectSlot={(time) => setSelectedTime(time)}
                                            onContinue={() => selectedTime && setStep('form')}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center rounded-[24px] border border-dashed border-cal-border bg-cal-bg-subtle/60 p-8 text-center text-cal-text-muted">
                                            Select a date to view available times.
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                <div className="py-8 text-center text-[2rem] font-semibold tracking-tight text-cal-text-primary/90">Cal.com</div>
            </div>
        </div>
    );
}
