import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    AppWindow,
    ArrowLeft,
    Calendar,
    ChevronRight,
    Clock3,
    Code2,
    ExternalLink,
    Globe,
    Link2,
    Repeat,
    SlidersHorizontal,
    Trash2,
    Webhook,
    Workflow,
} from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import { useEventTypeStore } from '../stores/eventTypeStore';
import { useAvailabilityStore } from '../stores/availabilityStore';
import { defaultUser } from '../data/seed';
import { cn, slugify } from '../lib/utils';
import { normalizeEventTypeSettings, stableStringify } from '../lib/eventTypeSettings';
import type { BookingQuestionSetting, ConfirmationMode, DefaultCalendarView, EventTypeSettings } from '../types';

type SectionKey = 'basics' | 'availability' | 'limits' | 'advanced' | 'recurring' | 'apps' | 'workflows' | 'webhooks';

type EditorDraft = {
    title: string;
    slug: string;
    description: string;
    duration: number;
    isActive: boolean;
};

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BUFFER_OPTIONS = ['No buffer time', '5 mins', '10 mins', '15 mins', '30 mins'];
const NOTICE_UNITS = ['Minutes', 'Hours', 'Days'];
const SLOT_INTERVALS = ['Use event length (default)', '5 mins', '10 mins', '15 mins', '30 mins', '60 mins'];
const CANCEL_REASON_OPTIONS = ['Disabled', 'Optional', 'Mandatory for host only', 'Mandatory for everyone'];

function formatTo12Hour(time: string): string {
    const [hoursRaw, minutesRaw] = time.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    const suffix = hours >= 12 ? 'pm' : 'am';
    const normalized = hours % 12 === 0 ? 12 : hours % 12;
    return `${normalized}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}

function ToggleSettingCard({
    title,
    description,
    enabled,
    onChange,
    children,
}: {
    title: string;
    description: ReactNode;
    enabled: boolean;
    onChange: (checked: boolean) => void;
    children?: ReactNode;
}) {
    return (
        <div className="cal-card p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-[1.1rem] font-semibold text-cal-text-primary">{title}</h3>
                    <p className="mt-1 text-base text-cal-text-muted">{description}</p>
                </div>
                <Switch checked={enabled} onChange={onChange} />
            </div>
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}

export function EventTypeEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { eventTypes, updateEventType, deleteEventType } = useEventTypeStore();
    const availability = useAvailabilityStore((s) => s.availability);
    const eventType = useMemo(() => eventTypes.find((item) => item.id === id), [eventTypes, id]);

    const [activeSection, setActiveSection] = useState<SectionKey>('basics');
    const [draft, setDraft] = useState<EditorDraft | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [allowMultipleDurations, setAllowMultipleDurations] = useState(false);
    const [saving, setSaving] = useState(false);

    const [beforeEventBuffer, setBeforeEventBuffer] = useState('No buffer time');
    const [afterEventBuffer, setAfterEventBuffer] = useState('No buffer time');
    const [minimumNoticeValue, setMinimumNoticeValue] = useState(2);
    const [minimumNoticeUnit, setMinimumNoticeUnit] = useState('Hours');
    const [slotInterval, setSlotInterval] = useState('Use event length (default)');

    const [limitFrequency, setLimitFrequency] = useState(false);
    const [firstSlotOnly, setFirstSlotOnly] = useState(false);
    const [limitTotalDuration, setLimitTotalDuration] = useState(false);
    const [limitUpcomingPerBooker, setLimitUpcomingPerBooker] = useState(false);

    const [calendarEventName, setCalendarEventName] = useState('');
    const [calendarAccount, setCalendarAccount] = useState('Default');
    const [layoutMonth, setLayoutMonth] = useState(true);
    const [layoutWeekly, setLayoutWeekly] = useState(true);
    const [layoutColumn, setLayoutColumn] = useState(true);
    const [defaultView, setDefaultView] = useState<DefaultCalendarView>('Month');
    const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>('Email');
    const [bookingQuestions, setBookingQuestions] = useState<BookingQuestionSetting[]>([
        { id: 'name', label: 'Your name', typeLabel: 'Name', status: 'Required', enabled: true },
        { id: 'email', label: 'Email address', typeLabel: 'Email', status: 'Required', enabled: true },
        { id: 'phone', label: 'Phone number', typeLabel: 'Phone', status: 'Hidden', enabled: false },
        { id: 'agenda', label: 'What is this meeting about?', typeLabel: 'Short Text', status: 'Hidden', enabled: false },
        { id: 'notes', label: 'Additional notes', typeLabel: 'Long Text', status: 'Optional', enabled: true },
        { id: 'guests', label: 'Add guests', typeLabel: 'Multiple Emails', status: 'Optional', enabled: true },
        { id: 'reschedule', label: 'Reason for reschedule', typeLabel: 'Long Text', status: 'Optional', enabled: true },
    ]);

    const [requireCancellationReason, setRequireCancellationReason] = useState('Mandatory for host only');
    const [requiresConfirmation, setRequiresConfirmation] = useState(false);
    const [disableCancelling, setDisableCancelling] = useState(false);
    const [disableRescheduling, setDisableRescheduling] = useState(false);
    const [sendTranscription, setSendTranscription] = useState(true);
    const [autoTranslate, setAutoTranslate] = useState(false);
    const [interfaceLanguage, setInterfaceLanguage] = useState(false);
    const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
    const [hideNotesInCalendar, setHideNotesInCalendar] = useState(false);

    const [recurringEvent, setRecurringEvent] = useState(false);

    useEffect(() => {
        if (!eventType) return;
        const settings = normalizeEventTypeSettings(eventType.settings, eventType.title);

        setDraft({
            title: eventType.title,
            slug: eventType.slug,
            description: eventType.description,
            duration: eventType.duration,
            isActive: eventType.isActive,
        });
        setAllowMultipleDurations(settings.allowMultipleDurations);

        setBeforeEventBuffer(settings.limits.beforeEventBuffer);
        setAfterEventBuffer(settings.limits.afterEventBuffer);
        setMinimumNoticeValue(settings.limits.minimumNoticeValue);
        setMinimumNoticeUnit(settings.limits.minimumNoticeUnit);
        setSlotInterval(settings.limits.slotInterval);
        setLimitFrequency(settings.limits.limitFrequency);
        setFirstSlotOnly(settings.limits.firstSlotOnly);
        setLimitTotalDuration(settings.limits.limitTotalDuration);
        setLimitUpcomingPerBooker(settings.limits.limitUpcomingPerBooker);

        setCalendarEventName(settings.advanced.calendarEventName);
        setCalendarAccount(settings.advanced.calendarAccount);
        setLayoutMonth(settings.advanced.layoutMonth);
        setLayoutWeekly(settings.advanced.layoutWeekly);
        setLayoutColumn(settings.advanced.layoutColumn);
        setDefaultView(settings.advanced.defaultView);
        setConfirmationMode(settings.advanced.confirmationMode);
        setBookingQuestions(settings.advanced.bookingQuestions.map((question) => ({ ...question })));
        setRequireCancellationReason(settings.advanced.requireCancellationReason);
        setRequiresConfirmation(settings.advanced.requiresConfirmation);
        setDisableCancelling(settings.advanced.disableCancelling);
        setDisableRescheduling(settings.advanced.disableRescheduling);
        setSendTranscription(settings.advanced.sendTranscription);
        setAutoTranslate(settings.advanced.autoTranslate);
        setInterfaceLanguage(settings.advanced.interfaceLanguage);
        setRequiresEmailVerification(settings.advanced.requiresEmailVerification);
        setHideNotesInCalendar(settings.advanced.hideNotesInCalendar);

        setRecurringEvent(settings.recurring.recurringEvent);
        setSlugManuallyEdited(true);
    }, [eventType]);

    const currentSettings = useMemo<EventTypeSettings>(() => {
        return {
            allowMultipleDurations,
            limits: {
                beforeEventBuffer,
                afterEventBuffer,
                minimumNoticeValue,
                minimumNoticeUnit,
                slotInterval,
                limitFrequency,
                firstSlotOnly,
                limitTotalDuration,
                limitUpcomingPerBooker,
            },
            advanced: {
                calendarEventName,
                calendarAccount,
                layoutMonth,
                layoutWeekly,
                layoutColumn,
                defaultView,
                confirmationMode,
                bookingQuestions: bookingQuestions.map((question) => ({ ...question })),
                requireCancellationReason,
                requiresConfirmation,
                disableCancelling,
                disableRescheduling,
                sendTranscription,
                autoTranslate,
                interfaceLanguage,
                requiresEmailVerification,
                hideNotesInCalendar,
            },
            recurring: {
                recurringEvent,
            },
        };
    }, [
        allowMultipleDurations,
        beforeEventBuffer,
        afterEventBuffer,
        minimumNoticeValue,
        minimumNoticeUnit,
        slotInterval,
        limitFrequency,
        firstSlotOnly,
        limitTotalDuration,
        limitUpcomingPerBooker,
        calendarEventName,
        calendarAccount,
        layoutMonth,
        layoutWeekly,
        layoutColumn,
        defaultView,
        confirmationMode,
        bookingQuestions,
        requireCancellationReason,
        requiresConfirmation,
        disableCancelling,
        disableRescheduling,
        sendTranscription,
        autoTranslate,
        interfaceLanguage,
        requiresEmailVerification,
        hideNotesInCalendar,
        recurringEvent,
    ]);

    const dirty = useMemo(() => {
        if (!eventType || !draft) return false;
        const baseDirty = (
            eventType.title !== draft.title ||
            eventType.slug !== draft.slug ||
            eventType.description !== draft.description ||
            eventType.duration !== draft.duration ||
            eventType.isActive !== draft.isActive
        );
        const savedSettings = normalizeEventTypeSettings(eventType.settings, eventType.title);
        const settingsDirty = stableStringify(savedSettings) !== stableStringify(currentSettings);
        return baseDirty || settingsDirty;
    }, [eventType, draft, currentSettings]);

    const orderedSchedule = useMemo(() => {
        return [...availability.schedule].sort((a, b) => a.day - b.day);
    }, [availability.schedule]);

    if (!eventType || !draft) {
        return (
            <Shell>
                <div className="cal-card p-8 text-center">
                    <h2 className="text-xl font-semibold text-cal-text-primary">Event type not found</h2>
                    <p className="mt-2 text-sm text-cal-text-muted">This event type no longer exists.</p>
                    <Button className="mt-4" onClick={() => navigate('/event-types')}>Back to event types</Button>
                </div>
            </Shell>
        );
    }

    const publicUrl = `${window.location.origin}/${defaultUser.username}/${draft.slug}`;

    async function onSave() {
        if (!eventType || !draft) return;
        setSaving(true);
        await updateEventType(eventType.id, {
            title: draft.title.trim(),
            slug: draft.slug.trim(),
            description: draft.description,
            duration: draft.duration,
            isActive: draft.isActive,
            settings: currentSettings,
        });
        setSaving(false);
    }

    async function onDelete() {
        if (!eventType) return;
        const ok = window.confirm('Delete this event type? This cannot be undone.');
        if (!ok) return;
        await deleteEventType(eventType.id);
        navigate('/event-types');
    }

    const sidebarItems: Array<{ key: SectionKey; label: string; subLabel: string; icon: typeof Link2 }> = [
        { key: 'basics', label: 'Basics', subLabel: `${draft?.duration ?? 0} mins`, icon: Link2 },
        { key: 'availability', label: 'Availability', subLabel: 'Working hours', icon: Calendar },
        { key: 'limits', label: 'Limits', subLabel: 'How often you can be booked', icon: Clock3 },
        { key: 'advanced', label: 'Advanced', subLabel: 'Calendar settings & more...', icon: SlidersHorizontal },
        { key: 'recurring', label: 'Recurring', subLabel: 'Set up a repeating schedule', icon: Repeat },
        { key: 'apps', label: 'Apps', subLabel: '0 apps, 0 active', icon: AppWindow },
        { key: 'workflows', label: 'Workflows', subLabel: '0 active', icon: Workflow },
        { key: 'webhooks', label: 'Webhooks', subLabel: '0 active', icon: Webhook },
    ];

    function renderBasicsSection() {
        return (
            <div className="space-y-5">
                <div className="cal-card p-6">
                    <div className="space-y-4">
                        <Input
                            label="Title"
                            value={draft?.title ?? ''}
                            onChange={(event) => {
                                const nextTitle = event.target.value;
                                setDraft((prev) => (prev ? { ...prev, title: nextTitle } : prev));
                                if (!slugManuallyEdited) {
                                    setDraft((prev) => (prev ? { ...prev, slug: slugify(nextTitle) } : prev));
                                }
                            }}
                        />

                        <Textarea
                            label="Description"
                            rows={3}
                            placeholder="A quick video meeting."
                            value={draft?.description ?? ''}
                            onChange={(event) => setDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
                        />

                        <Input
                            label="URL"
                            value={`cal.com/${defaultUser.username}/${draft?.slug ?? ''}`}
                            onChange={(event) => {
                                setSlugManuallyEdited(true);
                                const value = event.target.value.replace(`cal.com/${defaultUser.username}/`, '');
                                setDraft((prev) => (prev ? { ...prev, slug: slugify(value) } : prev));
                            }}
                        />
                    </div>
                </div>

                <div className="cal-card p-6">
                    <h3 className="mb-3 text-[1.3rem] font-semibold text-cal-text-primary">Duration</h3>
                    <div className="flex items-center gap-3">
                        <Input
                            type="number"
                            min={5}
                            max={480}
                            value={draft?.duration ?? 30}
                            onChange={(event) => {
                                const parsed = Number(event.target.value);
                                setDraft((prev) => (prev ? { ...prev, duration: Number.isFinite(parsed) ? parsed : prev.duration } : prev));
                            }}
                        />
                        <div className="h-10 min-w-[95px] rounded-lg border border-cal-border bg-cal-bg-surface px-3 py-2 text-base text-cal-text-muted">
                            Minutes
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <Switch checked={allowMultipleDurations} onChange={setAllowMultipleDurations} />
                        <span className="text-base text-cal-text-default">Allow multiple durations</span>
                    </div>
                </div>

                <div className="cal-card p-6">
                    <h3 className="mb-3 text-[1.3rem] font-semibold text-cal-text-primary">Location</h3>
                    <select className="cal-input h-12 w-full">
                        <option>Cal Video (Default)</option>
                        <option>Google Meet</option>
                        <option>Zoom</option>
                        <option>Phone call</option>
                    </select>
                    <div className="mt-3 text-base text-cal-text-muted">Show advanced settings</div>
                    <button type="button" className="mt-2 text-[1.05rem] text-cal-text-primary">+ Add a location</button>
                    <p className="mt-4 text-sm text-cal-text-muted">
                        Can&apos;t find the right conferencing app? Visit our <span className="text-cal-text-primary underline">App Store</span>.
                    </p>
                </div>
            </div>
        );
    }

    function renderAvailabilitySection() {
        return (
            <div className="cal-card overflow-hidden">
                <div className="border-b border-cal-border p-6">
                    <label className="text-[1.1rem] font-semibold text-cal-text-primary">Availability</label>
                    <div className="mt-3">
                        <select className="cal-input h-12 w-full">
                            <option>{availability.name || 'Working hours'} (Default)</option>
                        </select>
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {orderedSchedule.map((entry) => {
                            const unavailable = !entry.enabled || entry.timeRanges.length === 0;
                            const firstRange = entry.timeRanges[0];
                            return (
                                <div key={entry.day} className="grid grid-cols-[140px_1fr] items-center gap-4 sm:grid-cols-[140px_120px_40px_120px]">
                                    <div className={cn('text-[1.05rem] text-cal-text-primary', unavailable && 'line-through text-cal-text-dimmed')}>
                                        {WEEK_DAYS[entry.day]}
                                    </div>
                                    {unavailable ? (
                                        <div className="text-[1.05rem] text-cal-text-dimmed">Unavailable</div>
                                    ) : (
                                        <>
                                            <div className="text-[1.05rem] text-cal-text-default">{formatTo12Hour(firstRange.start)}</div>
                                            <div className="text-center text-[1.05rem] text-cal-text-dimmed">-</div>
                                            <div className="text-[1.05rem] text-cal-text-default">{formatTo12Hour(firstRange.end)}</div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-cal-border p-6">
                    <div className="inline-flex items-center gap-2 text-[1.05rem] text-cal-text-default">
                        <Globe size={16} />
                        {availability.timezone}
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/availability')}
                        className="inline-flex items-center gap-1 text-[1.05rem] text-cal-text-primary underline"
                    >
                        Edit availability
                        <ExternalLink size={14} />
                    </button>
                </div>
            </div>
        );
    }

    function renderLimitsSection() {
        return (
            <div className="space-y-5">
                <div className="cal-card p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-[1.1rem] font-semibold text-cal-text-primary">Before event</label>
                            <select value={beforeEventBuffer} onChange={(e) => setBeforeEventBuffer(e.target.value)} className="cal-input mt-2 h-12 w-full">
                                {BUFFER_OPTIONS.map((x) => <option key={x}>{x}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[1.1rem] font-semibold text-cal-text-primary">After event</label>
                            <select value={afterEventBuffer} onChange={(e) => setAfterEventBuffer(e.target.value)} className="cal-input mt-2 h-12 w-full">
                                {BUFFER_OPTIONS.map((x) => <option key={x}>{x}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[1.1rem] font-semibold text-cal-text-primary">Minimum notice</label>
                            <div className="mt-2 grid grid-cols-[1fr_200px] gap-2">
                                <Input type="number" min={0} value={minimumNoticeValue} onChange={(e) => setMinimumNoticeValue(Number(e.target.value) || 0)} />
                                <select value={minimumNoticeUnit} onChange={(e) => setMinimumNoticeUnit(e.target.value)} className="cal-input h-10 w-full">
                                    {NOTICE_UNITS.map((x) => <option key={x}>{x}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[1.1rem] font-semibold text-cal-text-primary">Time-slot intervals</label>
                            <select value={slotInterval} onChange={(e) => setSlotInterval(e.target.value)} className="cal-input mt-2 h-12 w-full">
                                {SLOT_INTERVALS.map((x) => <option key={x}>{x}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <ToggleSettingCard
                    title="Limit booking frequency"
                    description={<>Limit how many times this event can be booked. <span className="underline">Learn more</span></>}
                    enabled={limitFrequency}
                    onChange={setLimitFrequency}
                />
                <ToggleSettingCard
                    title="Only show the first slot of each day as available"
                    description="This will limit your availability for this event type to one slot per day, scheduled at the earliest available time."
                    enabled={firstSlotOnly}
                    onChange={setFirstSlotOnly}
                />
                <ToggleSettingCard
                    title="Limit total booking duration"
                    description="Limit total amount of time that this event can be booked"
                    enabled={limitTotalDuration}
                    onChange={setLimitTotalDuration}
                />
                <ToggleSettingCard
                    title="Limit number of upcoming bookings per booker"
                    description={<>Limit the number of active bookings a booker can make for this event type. <span className="underline">Learn more</span></>}
                    enabled={limitUpcomingPerBooker}
                    onChange={setLimitUpcomingPerBooker}
                />
            </div>
        );
    }

    function renderAdvancedSection() {
        return (
            <div className="space-y-5">
                <div className="cal-card p-6">
                    <div>
                        <label className="text-[1.1rem] font-semibold text-cal-text-primary">Calendar event name</label>
                        <div className="relative mt-2">
                            <input
                                value={calendarEventName}
                                onChange={(e) => setCalendarEventName(e.target.value)}
                                className="cal-input h-12 w-full pr-12"
                            />
                            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-cal-text-muted hover:bg-cal-bg-subtle">
                                <SlidersHorizontal size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="text-[1.1rem] font-semibold text-cal-text-primary">Add to calendar</label>
                        <select value={calendarAccount} onChange={(e) => setCalendarAccount(e.target.value)} className="cal-input mt-2 h-12 w-full">
                            <option>Default | bt23cse219@iiitn.ac.in</option>
                            <option>Personal | {defaultUser.username}@example.com</option>
                        </select>
                        <p className="mt-2 text-base text-cal-text-muted">We&apos;ll display this email address as the organizer, and send confirmation emails here.</p>
                    </div>
                </div>

                <div className="cal-card p-6">
                    <h3 className="text-[1.3rem] font-semibold text-cal-text-primary">Layout</h3>
                    <p className="mt-1 text-base text-cal-text-muted">You can select multiple and your bookers can switch views.</p>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {[
                            { label: 'Month', checked: layoutMonth, setChecked: setLayoutMonth },
                            { label: 'Weekly', checked: layoutWeekly, setChecked: setLayoutWeekly },
                            { label: 'Column', checked: layoutColumn, setChecked: setLayoutColumn },
                        ].map((view) => (
                            <div key={view.label}>
                                <div className="h-[170px] rounded-2xl border border-cal-border bg-cal-bg-subtle/50" />
                                <div className="mt-2 flex items-center gap-2">
                                    <input type="checkbox" checked={view.checked} onChange={(e) => view.setChecked(e.target.checked)} className="h-4 w-4" />
                                    <span className="text-[1.05rem] text-cal-text-primary">{view.label}{view.label === 'Month' ? ' (Default)' : ''}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5">
                        <label className="text-[1.1rem] font-semibold text-cal-text-primary">Default view</label>
                        <div className="mt-2 inline-flex overflow-hidden rounded-lg border border-cal-border">
                            {(['Month', 'Weekly', 'Column'] as const).map((view) => (
                                <button
                                    key={view}
                                    type="button"
                                    onClick={() => setDefaultView(view)}
                                    className={cn(
                                        'px-4 py-2 text-base transition-colors',
                                        defaultView === view ? 'bg-cal-bg-emphasis text-white' : 'text-cal-text-muted hover:bg-cal-bg-subtle'
                                    )}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="mt-5 text-base text-cal-text-muted">
                        You can manage this for all your event types in Settings -&gt; <span className="underline">Appearance</span> or <span className="underline">Override</span> for this event only.
                    </p>
                </div>

                <div className="cal-card p-6">
                    <h3 className="text-[1.3rem] font-semibold text-cal-text-primary">Booking questions</h3>
                    <p className="mt-1 text-base text-cal-text-muted">Customize the questions asked on the booking page. <span className="underline">Learn more</span></p>

                    <div className="mt-5 rounded-xl border border-cal-border p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-[1.1rem] font-semibold text-cal-text-primary">Confirmation</div>
                                <div className="text-base text-cal-text-muted">What your booker should provide to receive confirmations</div>
                            </div>
                            <div className="inline-flex overflow-hidden rounded-lg border border-cal-border">
                                {(['Email', 'Phone'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setConfirmationMode(mode)}
                                        className={cn(
                                            'px-3 py-2 text-base',
                                            confirmationMode === mode ? 'bg-cal-bg-emphasis text-white' : 'text-cal-text-muted'
                                        )}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-xl border border-cal-border">
                            {bookingQuestions.map((question, index) => (
                                <div key={question.id} className={cn('flex items-center justify-between gap-4 p-4', index !== 0 && 'border-t border-cal-border')}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[1.1rem] font-semibold text-cal-text-primary">{question.label}</span>
                                            <span className="rounded-md bg-cal-bg-subtle px-2 py-0.5 text-sm text-cal-text-muted">{question.status}</span>
                                        </div>
                                        <div className="text-base text-cal-text-muted">{question.typeLabel}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={question.enabled}
                                            onChange={(checked) => {
                                                setBookingQuestions((prev) => prev.map((item) => item.id === question.id ? { ...item, enabled: checked } : item));
                                            }}
                                        />
                                        <button type="button" className="rounded-lg border border-cal-border px-3 py-1.5 text-base text-cal-text-primary">Edit</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" className="mt-4 text-[1.05rem] text-cal-text-primary">+ Add a question</button>
                    </div>
                </div>

                <div className="cal-card p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-[1.1rem] font-semibold text-cal-text-primary">Require cancellation reason</h3>
                            <p className="text-base text-cal-text-muted">Ask for a reason when someone cancels a booking</p>
                        </div>
                        <select value={requireCancellationReason} onChange={(e) => setRequireCancellationReason(e.target.value)} className="cal-input h-12 w-[280px]">
                            {CANCEL_REASON_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                        </select>
                    </div>
                </div>

                <ToggleSettingCard
                    title="Requires confirmation"
                    description={<>The booking needs to be manually confirmed before it is pushed to your calendar and a confirmation is sent. <span className="underline">Learn more</span></>}
                    enabled={requiresConfirmation}
                    onChange={setRequiresConfirmation}
                />
                <ToggleSettingCard
                    title="Disable cancelling"
                    description={<>Disable event cancellation via calendar invite or email. <span className="underline">Learn more</span></>}
                    enabled={disableCancelling}
                    onChange={setDisableCancelling}
                />
                <ToggleSettingCard
                    title="Disable rescheduling"
                    description={<>Disable rescheduling via calendar invite or email. <span className="underline">Learn more</span></>}
                    enabled={disableRescheduling}
                    onChange={setDisableRescheduling}
                />
                <ToggleSettingCard
                    title="Send Cal Video transcription emails"
                    description="Send emails with the transcription of the Cal Video after the meeting ends. (Requires a paid plan)"
                    enabled={sendTranscription}
                    onChange={setSendTranscription}
                />
                <ToggleSettingCard
                    title="Auto translate title and description"
                    description="Automatically translate titles and descriptions to the visitor's browser language using AI."
                    enabled={autoTranslate}
                    onChange={setAutoTranslate}
                />
                <ToggleSettingCard
                    title="Interface language"
                    description="Set your preferred language for the booking interface"
                    enabled={interfaceLanguage}
                    onChange={setInterfaceLanguage}
                />
                <ToggleSettingCard
                    title="Requires booker email verification"
                    description="To ensure booker's email verification before scheduling events"
                    enabled={requiresEmailVerification}
                    onChange={setRequiresEmailVerification}
                />
                <ToggleSettingCard
                    title="Hide notes in calendar"
                    description={<>For privacy reasons, additional inputs and notes will be hidden in the calendar entry. They will still be sent to your email. <span className="underline">Learn more</span></>}
                    enabled={hideNotesInCalendar}
                    onChange={setHideNotesInCalendar}
                />
            </div>
        );
    }

    function renderRecurringSection() {
        return (
            <div className="space-y-5">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-[1.05rem] text-amber-300">
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={18} className="mt-0.5" />
                        <span>Experimental: Recurring Events are currently experimental and causes some issues sometimes when checking for availability. We are working on fixing this.</span>
                    </div>
                </div>

                <ToggleSettingCard
                    title="Recurring event"
                    description={<>People can subscribe for recurring events. <span className="underline">Learn more</span></>}
                    enabled={recurringEvent}
                    onChange={setRecurringEvent}
                />
            </div>
        );
    }

    function renderSimpleSection(title: string, description: string) {
        return (
            <div className="cal-card p-8 text-center">
                <h3 className="text-[1.4rem] font-semibold text-cal-text-primary">{title}</h3>
                <p className="mt-2 text-base text-cal-text-muted">{description}</p>
            </div>
        );
    }

    function renderActiveSection() {
        switch (activeSection) {
            case 'basics':
                return renderBasicsSection();
            case 'availability':
                return renderAvailabilitySection();
            case 'limits':
                return renderLimitsSection();
            case 'advanced':
                return renderAdvancedSection();
            case 'recurring':
                return renderRecurringSection();
            case 'apps':
                return renderSimpleSection('Apps', 'No apps are active for this event type yet.');
            case 'workflows':
                return renderSimpleSection('Workflows', 'No workflow automation is active right now.');
            case 'webhooks':
                return renderSimpleSection('Webhooks', 'No webhooks configured for this event type.');
            default:
                return null;
        }
    }

    return (
        <Shell>
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/event-types')}
                        className="rounded-lg p-2 text-cal-text-muted transition-colors hover:bg-cal-bg-subtle hover:text-cal-text-primary"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="truncate text-[2rem] font-semibold tracking-tight text-cal-text-primary">{draft.title || 'Event type'}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <Switch
                        checked={draft.isActive}
                        onChange={(checked) => setDraft((prev) => (prev ? { ...prev, isActive: checked } : prev))}
                    />
                    <span className="h-6 w-px bg-cal-border" />
                    <button
                        type="button"
                        title="Open public page"
                        onClick={() => window.open(publicUrl, '_blank')}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-cal-border text-cal-text-muted transition-colors hover:bg-cal-bg-subtle hover:text-cal-text-primary"
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button
                        type="button"
                        title="Copy public URL"
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(publicUrl);
                            } catch {
                                // ignore clipboard failures
                            }
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-cal-border text-cal-text-muted transition-colors hover:bg-cal-bg-subtle hover:text-cal-text-primary"
                    >
                        <Link2 size={16} />
                    </button>
                    <button
                        type="button"
                        title="Embed"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-cal-border text-cal-text-muted transition-colors hover:bg-cal-bg-subtle hover:text-cal-text-primary"
                    >
                        <Code2 size={16} />
                    </button>
                    <button
                        type="button"
                        title="Delete event type"
                        onClick={onDelete}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-cal-border text-cal-error transition-colors hover:bg-red-500/10"
                    >
                        <Trash2 size={16} />
                    </button>
                    <span className="h-6 w-px bg-cal-border" />
                    <Button variant="primary" onClick={onSave} disabled={!dirty || saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
                <aside className="h-fit rounded-2xl border border-cal-border bg-cal-bg-card p-3">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeSection === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setActiveSection(item.key)}
                                className={cn(
                                    'mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors',
                                    active ? 'bg-cal-bg-subtle text-cal-text-primary' : 'text-cal-text-muted hover:bg-cal-bg-subtle/60'
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Icon size={18} />
                                    <div>
                                        <div className="text-[1.05rem] font-medium">{item.label}</div>
                                        <div className="text-sm text-cal-text-dimmed">{item.subLabel}</div>
                                    </div>
                                </div>
                                {active && <ChevronRight size={16} />}
                            </button>
                        );
                    })}
                </aside>

                <section className="space-y-5">{renderActiveSection()}</section>
            </div>
        </Shell>
    );
}
