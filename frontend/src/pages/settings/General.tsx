import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, updateUserById } from '../../lib/api';
import { getTimezoneOptions } from '../../lib/timezones';

export function General() {
    const [language, setLanguage] = useState('en');
    const [timezone, setTimezone] = useState('UTC');
    const [timeFormat, setTimeFormat] = useState('12-hour');
    const [startOfWeek, setStartOfWeek] = useState('Sunday');
    const [timezones, setTimezones] = useState<{ value: string; label: string }[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTimezones(getTimezoneOptions());
        try {
            const tz = (Intl as any)?.DateTimeFormat()?.resolvedOptions?.()?.timeZone || 'UTC';
            setTimezone(tz);
        } catch (e) {}

        fetchCurrentUser().then((u: any) => {
            if (!u) return;
            if (u.timezone) setTimezone(u.timezone);
            if (u.language) setLanguage(u.language);
            if (u.time_format) setTimeFormat(u.time_format);
            if (u.start_of_week) setStartOfWeek(u.start_of_week);
        }).catch(() => {});
    }, []);

    async function handleUpdate() {
        setSaving(true);
        try {
            const u: any = await fetchCurrentUser();
            if (!u?.id) return;
            await updateUserById(u.id, {
                timezone,
                language,
                time_format: timeFormat,
                start_of_week: startOfWeek,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader title="General" subtitle="Manage settings for your language and timezone" />

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm text-cal-text-muted">Language</label>
                        <div className="mt-2">
                            <Select options={[{ value: 'en', label: 'English' }]} value={language} onChange={(e) => setLanguage(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-cal-text-muted">Timezone</label>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1">
                                <Select options={timezones} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                            </div>
                            <Button size="sm" variant="outline">Schedule timezone change</Button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-cal-text-muted">Time format</label>
                        <div className="mt-2">
                            <Select options={[{ value: '12-hour', label: '12-hour' }, { value: '24-hour', label: '24-hour' }]} value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-cal-text-muted">Start of week</label>
                        <div className="mt-2">
                            <Select options={[{ value: 'Sunday', label: 'Sunday' }, { value: 'Monday', label: 'Monday' }]} value={startOfWeek} onChange={(e) => setStartOfWeek(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Update'}</Button>
                </div>
            </Card>

            <Card>
                <div>
                    <h3 className="font-semibold text-cal-text-primary">Dynamic group links</h3>
                    <p className="text-sm text-cal-text-muted mt-1">Allow attendees to book you through dynamic group bookings</p>
                </div>
            </Card>
        </div>
    );
}

export default General;
