import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import api from '../lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
  'America/Chicago',
  'America/Denver',
];

function createEmptyWeekSchedule() {
  return Array.from({ length: 7 }, (_, day) => ({ day, enabled: false, timeRanges: [] as Array<{ start: string; end: string }> }));
}

export function ScheduleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [isDefault, setIsDefault] = useState(false);
  const [schedule, setSchedule] = useState(createEmptyWeekSchedule());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) { navigate('/availability'); return; }
    setLoading(true);
    api.fetchSchedule(id as string)
      .then((row: any) => {
        setName(row.name || '');
        setTimezone(row.timezone || 'UTC');
        setIsDefault(Boolean(row.is_default));

        const s = createEmptyWeekSchedule();
        if (Array.isArray(row.timeRanges)) {
          for (const tr of row.timeRanges) {
            const day = Number(tr.day_of_week ?? tr.day);
            const idx = s.findIndex((d) => d.day === day);
            if (idx !== -1) {
              s[idx].enabled = true;
              s[idx].timeRanges.push({ start: String(tr.start_time || '').slice(0, 5), end: String(tr.end_time || '').slice(0, 5) });
            }
          }
        }
        setSchedule(s);
      })
      .catch((err) => {
        console.error('load schedule failed', err);
        alert('Failed to load schedule');
        navigate('/availability');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  function toggleDay(day: number) {
    setSchedule((s) => s.map((d) => (d.day === day ? { ...d, enabled: !d.enabled, timeRanges: !d.enabled && d.timeRanges.length === 0 ? [{ start: '09:00', end: '17:00' }] : d.timeRanges } : d)));
  }

  function addTimeRange(day: number) {
    setSchedule((s) => s.map((d) => (d.day === day ? { ...d, timeRanges: [...d.timeRanges, { start: '09:00', end: '17:00' }] } : d)));
  }

  function removeTimeRange(day: number, idx: number) {
    setSchedule((s) => s.map((d) => (d.day === day ? { ...d, timeRanges: d.timeRanges.filter((_, i) => i !== idx) } : d)));
  }

  function updateTimeRange(day: number, index: number, field: 'start' | 'end', value: string) {
    setSchedule((s) => s.map((d) => (d.day === day ? { ...d, timeRanges: d.timeRanges.map((tr, i) => (i === index ? { ...tr, [field]: value } : tr)) } : d)));
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      const timeRanges: any[] = [];
      for (const d of schedule) {
        if (!d.enabled) continue;
        for (const tr of d.timeRanges) {
          timeRanges.push({ day_of_week: d.day, start_time: tr.start, end_time: tr.end });
        }
      }

      await api.updateSchedule(id, { name, timezone, timeRanges });
      alert('Saved');
      navigate('/availability');
    } catch (err: any) {
      console.error('save failed', err);
      alert(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (isDefault) return alert('Cannot delete default schedule');
    if (!confirm('Delete this schedule?')) return;
    try {
      await api.deleteSchedule(id);
      navigate('/availability');
    } catch (err: any) {
      console.error('delete failed', err);
      alert(err?.message || 'Delete failed');
    }
  }

  if (loading) return <div className="text-cal-text-muted">Loading…</div>;

  return (
    <Shell>
      <PageHeader
        title={name || 'Schedule'}
        subtitle="Edit your weekly availability"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/availability')}>Back</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDefault}>Delete</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </div>
        }
      />

      <Card noPadding>
        <div className="px-6 py-6">
          <label className="text-sm text-cal-text-muted">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 mb-4" />

          <label className="text-sm text-cal-text-muted">Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-2 w-full rounded-md border border-cal-border px-3 py-2 bg-cal-bg-surface mb-6">
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>

          {schedule.map((d) => {
            const enabled = d.enabled;
            const ranges = d.timeRanges || [];
            return (
              <div key={d.day} className="border-t border-cal-border px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex w-full items-center justify-between lg:w-52 lg:justify-start lg:gap-4">
                    <Switch checked={enabled} onChange={() => toggleDay(d.day)} />
                    <div className="text-base font-medium text-cal-text-primary">{DAYS[d.day]}</div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {!enabled && (
                      <div className="rounded-xl border border-dashed border-cal-border bg-cal-bg-subtle/70 px-4 py-3 text-sm text-cal-text-dimmed">
                        Unavailable
                      </div>
                    )}

                    {enabled && ranges.map((range, rangeIndex) => (
                      <div key={`${d.day}-${rangeIndex}`} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Input
                          type="time"
                          value={range.start}
                          onChange={(e) => updateTimeRange(d.day, rangeIndex, 'start', e.target.value)}
                          className="sm:max-w-[150px]"
                        />
                        <span className="text-cal-text-dimmed">to</span>
                        <Input
                          type="time"
                          value={range.end}
                          onChange={(e) => updateTimeRange(d.day, rangeIndex, 'end', e.target.value)}
                          className="sm:max-w-[150px]"
                        />
                        {ranges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeRange(d.day, rangeIndex)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}

                    {enabled && (
                      <button
                        type="button"
                        onClick={() => addTimeRange(d.day)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-cal-text-muted transition-colors hover:text-cal-text-primary"
                      >
                        <Plus size={15} />
                        Add time range
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </Shell>
  );
}

export default ScheduleEditorPage;
