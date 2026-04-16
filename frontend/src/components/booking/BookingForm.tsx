import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import type { EventType } from '../../types';

interface BookingFormProps {
    eventType: EventType;
    selectedDate: Date;
    selectedTime: string;
    onBack: () => void;
    onConfirm: (data: { name: string; email: string; notes: string }) => Promise<void> | void;
}

export function BookingForm({
    eventType,
    selectedDate,
    selectedTime,
    onBack,
    onConfirm,
}: BookingFormProps) {
    void eventType;
    void selectedDate;
    void selectedTime;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await onConfirm({ name, email, notes });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-[430px]">
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Your name"
                    required
                    autoFocus
                    placeholder="Srijan Verma"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
                <Input
                    label="Email address"
                    type="email"
                    required
                    placeholder="srijan@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <Textarea
                    label="Additional notes"
                    placeholder="Please share anything that will help prepare for our meeting."
                    rows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                />

                <button type="button" className="text-left text-base font-medium text-cal-text-muted transition-colors hover:text-cal-text-primary">
                    Add guests
                </button>

                <p className="pt-6 text-sm leading-6 text-cal-text-dimmed">
                    By proceeding, you agree to Cal.com&apos;s <span className="text-cal-text-primary">Terms</span> and <span className="text-cal-text-primary">Privacy Policy</span>.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onBack}>
                        Back
                    </Button>
                    <Button type="submit" disabled={submitting}>{submitting ? 'Confirming...' : 'Confirm'}</Button>
                </div>
            </form>
        </div>
    );
}
