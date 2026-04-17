import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function Calendars() {
    const [connecting, setConnecting] = useState(false);

    function handleConnectGoogle() {
        setConnecting(true);
        const url = `${API_BASE}/api/integrations/google/authorize`;
        // open OAuth in a new tab/window
        window.open(url, '_blank');
        setTimeout(() => setConnecting(false), 800);
    }

    function handleConnectMicrosoft() {
        setConnecting(true);
        const url = `${API_BASE}/api/integrations/microsoft/authorize`;
        window.open(url, '_blank');
        setTimeout(() => setConnecting(false), 800);
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Calendars" subtitle="Configure how your event types interact with your calendars" />

            <div className="mt-6">
                <div className="rounded-lg border border-cal-border p-12 text-center">
                    <div className="text-3xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-cal-text-primary">No calendar apps</h3>
                    <p className="text-sm text-cal-text-muted mt-2">Add a calendar app to check for conflicts to prevent double bookings</p>
                    <div className="mt-4">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button variant="outline" onClick={handleConnectGoogle} disabled={connecting}>Connect Google Calendar</Button>
                            <Button variant="outline" onClick={handleConnectMicrosoft} disabled={connecting}>Connect Outlook</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Calendars;
