import type { Booking } from '../../types';
import { BookingRow } from './BookingRow';
import { Card } from '../ui/Card';
import { Calendar } from 'lucide-react';

interface BookingListProps {
    bookings: Booking[];
    onCancel: (id: string) => void;
}

export function BookingList({ bookings, onCancel }: BookingListProps) {
    void onCancel;

    if (bookings.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center py-12">
                <Calendar size={40} className="text-cal-text-dimmed mb-3" />
                <p className="text-cal-text-muted text-sm">No bookings found</p>
                <p className="text-cal-text-dimmed text-xs mt-1">
                    When someone books a meeting with you, it will show up here.
                </p>
            </Card>
        );
    }

    return (
        <div>
            <p className="text-[11px] font-medium text-cal-text-dimmed uppercase tracking-wider mb-2">
                Next
            </p>
            <Card noPadding>
                {bookings.map((booking) => (
                    <BookingRow key={booking.id} {...booking} />
                ))}
            </Card>
        </div>
    );
}
