import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useBookingStore } from '../stores/bookingStore';
import { BookingRow } from '../components/bookings/BookingRow';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';

const TABS = [
    { id: 'upcoming', label: 'Upcoming', filter: (status: string) => status === 'upcoming' },
    { id: 'unconfirmed', label: 'Unconfirmed', filter: () => false },
    { id: 'recurring', label: 'Recurring', filter: () => false },
    { id: 'past', label: 'Past', filter: (status: string) => status === 'past' },
    { id: 'cancelled', label: 'Cancelled', filter: (status: string) => status === 'cancelled' || status === 'rescheduled' },
];

export function BookingsPage() {
    const [activeTab, setActiveTab] = useState('upcoming');
    const { bookings } = useBookingStore();

    const filteredBookings = bookings.filter((booking) => {
        const active = TABS.find((tab) => tab.id === activeTab);
        return active ? active.filter(booking.status) : true;
    });

    const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
        acc[tab.id] = bookings.filter((booking) => tab.filter(booking.status)).length;
        return acc;
    }, {});

    return (
        <Shell>
            <PageHeader
                title="Bookings"
                subtitle="See upcoming and past events booked through your event type links."
            />

            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} counts={counts} className="w-full overflow-auto xl:w-auto" />
                <div className="flex items-center justify-between gap-3 xl:justify-end">
                    <Button variant="outline" icon={<SlidersHorizontal size={15} />}>
                        Filter
                    </Button>
                    <Button variant="outline">
                        Saved filters
                    </Button>
                </div>
            </div>

            <Card noPadding className="overflow-hidden">
                <div className="border-b border-cal-border px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-cal-text-muted">
                    Next
                </div>
                {filteredBookings.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-cal-text-muted">
                        No bookings found for this filter.
                    </div>
                ) : (
                    filteredBookings.map((booking, index) => (
                        <div key={booking.id} className={index !== 0 ? 'border-t border-cal-border' : undefined}>
                            <BookingRow {...booking} />
                        </div>
                    ))
                )}
                <div className="flex items-center justify-between border-t border-cal-border px-6 py-4 text-sm text-cal-text-muted">
                    <div className="flex items-center gap-2">
                        <span className="rounded-lg border border-cal-border bg-cal-bg-subtle px-3 py-1.5 text-cal-text-primary">10</span>
                        rows per page
                    </div>
                    <div>{filteredBookings.length > 0 ? `1-${filteredBookings.length} of ${filteredBookings.length}` : '0 results'}</div>
                </div>
            </Card>
        </Shell>
    );
}
