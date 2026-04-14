import { Plus, Trash2, Globe } from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { useAvailabilityStore } from '../stores/availabilityStore';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityPage() {
    const { availability, updateAvailability, toggleDay, addTimeRange, removeTimeRange, updateTimeRange } = useAvailabilityStore();

    return (
        <Shell>
            <PageHeader
                title="Availability"
                subtitle="Configure times when you are available for bookings."
                actions={
                    <div className="inline-flex items-center rounded-xl border border-cal-border bg-cal-bg-subtle p-1 text-sm">
                        <button type="button" className="rounded-lg bg-white px-3 py-2 font-medium text-cal-text-inverted">
                            My availability
                        </button>
                        <button type="button" className="rounded-lg px-3 py-2 text-cal-text-muted">
                            Team availability
                        </button>
                    </div>
                }
            />

            <Card noPadding className="overflow-hidden">
                <div className="flex flex-col gap-6 border-b border-cal-border px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-semibold tracking-tight text-cal-text-primary">Working hours</h2>
                            <span className="rounded-lg bg-white/8 px-2 py-1 text-xs font-semibold text-cal-text-default">Default</span>
                        </div>
                        <p className="mt-2 text-cal-text-default">Mon - Fri, 9:00 AM - 5:00 PM</p>
                        <p className="mt-1 inline-flex items-center gap-2 text-cal-text-muted">
                            <Globe size={15} />
                            {availability.timezone}
                        </p>
                    </div>

                    <div className="w-full max-w-sm">
                        <Input
                            label="Timezone"
                            value={availability.timezone}
                            onChange={(event) => updateAvailability({ timezone: event.target.value })}
                            placeholder="Asia/Kolkata"
                        />
                    </div>
                </div>

                <div className="px-6 py-5 text-center text-sm text-cal-text-muted">
                    Temporarily out-of-office? <span className="text-cal-text-primary underline underline-offset-4">Add a redirect</span>
                </div>

                <div>
                    {DAYS.map((dayName, dayIndex) => {
                        const schedule = availability.schedule.find((entry) => entry.day === dayIndex);
                        const enabled = schedule?.enabled ?? false;
                        const ranges = schedule?.timeRanges ?? [];

                        return (
                            <div key={dayName} className="border-t border-cal-border px-6 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                                    <div className="flex w-full items-center justify-between lg:w-52 lg:justify-start lg:gap-4">
                                        <Switch checked={enabled} onChange={() => toggleDay(dayIndex)} />
                                        <div className="text-base font-medium text-cal-text-primary">{dayName}</div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        {!enabled && (
                                            <div className="rounded-xl border border-dashed border-cal-border bg-cal-bg-subtle/70 px-4 py-3 text-sm text-cal-text-dimmed">
                                                Unavailable
                                            </div>
                                        )}

                                        {enabled && ranges.map((range, rangeIndex) => (
                                            <div key={`${dayName}-${rangeIndex}`} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                <Input
                                                    type="time"
                                                    value={range.start}
                                                    onChange={(event) => updateTimeRange(dayIndex, rangeIndex, 'start', event.target.value)}
                                                    className="sm:max-w-[150px]"
                                                />
                                                <span className="text-cal-text-dimmed">to</span>
                                                <Input
                                                    type="time"
                                                    value={range.end}
                                                    onChange={(event) => updateTimeRange(dayIndex, rangeIndex, 'end', event.target.value)}
                                                    className="sm:max-w-[150px]"
                                                />
                                                {ranges.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTimeRange(dayIndex, rangeIndex)}
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
                                                onClick={() => addTimeRange(dayIndex)}
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

                <div className="flex justify-end border-t border-cal-border bg-cal-bg-subtle/50 px-6 py-4">
                    <Button>Save changes</Button>
                </div>
            </Card>
        </Shell>
    );
}
