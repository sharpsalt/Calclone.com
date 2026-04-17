import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (message?: string) => Promise<void> | void;
  submitting?: boolean;
}

export function RequestRescheduleDialog({ open, onClose, onConfirm, submitting }: Props) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) setMessage('');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#0b0e12] flex items-center justify-center border border-[#222]">
          <Clock size={20} className="text-white/90" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-cal-text-primary">Request reschedule</h3>
          <p className="mt-2 text-sm text-cal-text-muted">This will cancel the scheduled meeting, notify the scheduler and ask them to pick a new time.</p>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-semibold text-cal-text-primary">Reason for reschedule request <span className="text-sm text-cal-text-muted">(Optional)</span></label>
        <div className="mt-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-y focus:border-blue-400 focus:ring-0"
            placeholder="Add an optional message for the scheduler"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={Boolean(submitting)} onClick={async () => { await onConfirm(message || undefined); }}>{submitting ? 'Requesting...' : 'Request reschedule'}</Button>
      </div>
    </Dialog>
  );
}

export default RequestRescheduleDialog;
