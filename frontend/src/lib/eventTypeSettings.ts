import type {
    BookingQuestionSetting,
    BookingQuestionStatus,
    ConfirmationMode,
    DefaultCalendarView,
    EventTypeSettings,
} from '../types';

const DEFAULT_BOOKING_QUESTIONS: BookingQuestionSetting[] = [
    { id: 'name', label: 'Your name', typeLabel: 'Name', status: 'Required', enabled: true },
    { id: 'email', label: 'Email address', typeLabel: 'Email', status: 'Required', enabled: true },
    { id: 'phone', label: 'Phone number', typeLabel: 'Phone', status: 'Hidden', enabled: false },
    { id: 'agenda', label: 'What is this meeting about?', typeLabel: 'Short Text', status: 'Hidden', enabled: false },
    { id: 'notes', label: 'Additional notes', typeLabel: 'Long Text', status: 'Optional', enabled: true },
    { id: 'guests', label: 'Add guests', typeLabel: 'Multiple Emails', status: 'Optional', enabled: true },
    { id: 'reschedule', label: 'Reason for reschedule', typeLabel: 'Long Text', status: 'Optional', enabled: true },
];

const VIEW_OPTIONS: DefaultCalendarView[] = ['Month', 'Weekly', 'Column'];
const CONFIRMATION_OPTIONS: ConfirmationMode[] = ['Email', 'Phone'];
const QUESTION_STATUS_OPTIONS: BookingQuestionStatus[] = ['Required', 'Optional', 'Hidden'];

function cloneQuestions(questions: BookingQuestionSetting[]): BookingQuestionSetting[] {
    return questions.map((question) => ({ ...question }));
}

export function getDefaultEventTypeSettings(eventTitle?: string): EventTypeSettings {
    return {
        allowMultipleDurations: false,
        limits: {
            beforeEventBuffer: 'No buffer time',
            afterEventBuffer: 'No buffer time',
            minimumNoticeValue: 2,
            minimumNoticeUnit: 'Hours',
            slotInterval: 'Use event length (default)',
            limitFrequency: false,
            firstSlotOnly: false,
            limitTotalDuration: false,
            limitUpcomingPerBooker: false,
        },
        advanced: {
            calendarEventName: `${eventTitle || 'Meeting'} between Host and {Scheduler}`,
            calendarAccount: 'Default',
            layoutMonth: true,
            layoutWeekly: true,
            layoutColumn: true,
            defaultView: 'Month',
            confirmationMode: 'Email',
            bookingQuestions: cloneQuestions(DEFAULT_BOOKING_QUESTIONS),
            requireCancellationReason: 'Mandatory for host only',
            requiresConfirmation: false,
            disableCancelling: false,
            disableRescheduling: false,
            sendTranscription: true,
            autoTranslate: false,
            interfaceLanguage: false,
            requiresEmailVerification: false,
            hideNotesInCalendar: false,
        },
        recurring: {
            recurringEvent: false,
        },
    };
}

function asObject(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function getValue(source: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            return source[key];
        }
    }
    return undefined;
}

function getString(source: Record<string, unknown>, keys: string[], fallback: string): string {
    const value = getValue(source, keys);
    return typeof value === 'string' ? value : fallback;
}

function getBoolean(source: Record<string, unknown>, keys: string[], fallback: boolean): boolean {
    const value = getValue(source, keys);
    return typeof value === 'boolean' ? value : fallback;
}

function getNumber(source: Record<string, unknown>, keys: string[], fallback: number): number {
    const value = getValue(source, keys);
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeView(value: string, fallback: DefaultCalendarView): DefaultCalendarView {
    return VIEW_OPTIONS.includes(value as DefaultCalendarView) ? (value as DefaultCalendarView) : fallback;
}

function normalizeConfirmationMode(value: string, fallback: ConfirmationMode): ConfirmationMode {
    return CONFIRMATION_OPTIONS.includes(value as ConfirmationMode) ? (value as ConfirmationMode) : fallback;
}

function normalizeQuestionStatus(value: string, fallback: BookingQuestionStatus): BookingQuestionStatus {
    return QUESTION_STATUS_OPTIONS.includes(value as BookingQuestionStatus) ? (value as BookingQuestionStatus) : fallback;
}

function normalizeBookingQuestions(raw: unknown, fallback: BookingQuestionSetting[]): BookingQuestionSetting[] {
    if (!Array.isArray(raw)) {
        return cloneQuestions(fallback);
    }

    const normalized = raw
        .map((item, index) => {
            const source = asObject(item);
            const fallbackItem = fallback[index] || fallback[fallback.length - 1];
            const id = getString(source, ['id'], `${fallbackItem?.id || 'question'}-${index + 1}`);
            const label = getString(source, ['label'], fallbackItem?.label || 'Question');
            const typeLabel = getString(source, ['typeLabel', 'type_label'], fallbackItem?.typeLabel || 'Short Text');
            const status = normalizeQuestionStatus(getString(source, ['status'], fallbackItem?.status || 'Optional'), fallbackItem?.status || 'Optional');
            const enabled = getBoolean(source, ['enabled'], fallbackItem?.enabled ?? true);
            return { id, label, typeLabel, status, enabled };
        })
        .filter((item) => item.id.trim().length > 0);

    return normalized.length > 0 ? normalized : cloneQuestions(fallback);
}

export function normalizeEventTypeSettings(raw: unknown, eventTitle?: string): EventTypeSettings {
    const defaults = getDefaultEventTypeSettings(eventTitle);
    const source = asObject(raw);

    const limitsSource = asObject(getValue(source, ['limits']));
    const advancedSource = asObject(getValue(source, ['advanced']));
    const recurringSource = asObject(getValue(source, ['recurring']));

    const defaultViewRaw = getString(advancedSource, ['defaultView', 'default_view'], defaults.advanced.defaultView);
    const confirmationModeRaw = getString(advancedSource, ['confirmationMode', 'confirmation_mode'], defaults.advanced.confirmationMode);

    return {
        allowMultipleDurations: getBoolean(source, ['allowMultipleDurations', 'allow_multiple_durations'], defaults.allowMultipleDurations),
        limits: {
            beforeEventBuffer: getString(limitsSource, ['beforeEventBuffer', 'before_event_buffer'], defaults.limits.beforeEventBuffer),
            afterEventBuffer: getString(limitsSource, ['afterEventBuffer', 'after_event_buffer'], defaults.limits.afterEventBuffer),
            minimumNoticeValue: getNumber(limitsSource, ['minimumNoticeValue', 'minimum_notice_value'], defaults.limits.minimumNoticeValue),
            minimumNoticeUnit: getString(limitsSource, ['minimumNoticeUnit', 'minimum_notice_unit'], defaults.limits.minimumNoticeUnit),
            slotInterval: getString(limitsSource, ['slotInterval', 'slot_interval'], defaults.limits.slotInterval),
            limitFrequency: getBoolean(limitsSource, ['limitFrequency', 'limit_frequency'], defaults.limits.limitFrequency),
            firstSlotOnly: getBoolean(limitsSource, ['firstSlotOnly', 'first_slot_only'], defaults.limits.firstSlotOnly),
            limitTotalDuration: getBoolean(limitsSource, ['limitTotalDuration', 'limit_total_duration'], defaults.limits.limitTotalDuration),
            limitUpcomingPerBooker: getBoolean(limitsSource, ['limitUpcomingPerBooker', 'limit_upcoming_per_booker'], defaults.limits.limitUpcomingPerBooker),
        },
        advanced: {
            calendarEventName: getString(advancedSource, ['calendarEventName', 'calendar_event_name'], defaults.advanced.calendarEventName),
            calendarAccount: getString(advancedSource, ['calendarAccount', 'calendar_account'], defaults.advanced.calendarAccount),
            layoutMonth: getBoolean(advancedSource, ['layoutMonth', 'layout_month'], defaults.advanced.layoutMonth),
            layoutWeekly: getBoolean(advancedSource, ['layoutWeekly', 'layout_weekly'], defaults.advanced.layoutWeekly),
            layoutColumn: getBoolean(advancedSource, ['layoutColumn', 'layout_column'], defaults.advanced.layoutColumn),
            defaultView: normalizeView(defaultViewRaw, defaults.advanced.defaultView),
            confirmationMode: normalizeConfirmationMode(confirmationModeRaw, defaults.advanced.confirmationMode),
            bookingQuestions: normalizeBookingQuestions(getValue(advancedSource, ['bookingQuestions', 'booking_questions']), defaults.advanced.bookingQuestions),
            requireCancellationReason: getString(advancedSource, ['requireCancellationReason', 'require_cancellation_reason'], defaults.advanced.requireCancellationReason),
            requiresConfirmation: getBoolean(advancedSource, ['requiresConfirmation', 'requires_confirmation'], defaults.advanced.requiresConfirmation),
            disableCancelling: getBoolean(advancedSource, ['disableCancelling', 'disable_cancelling'], defaults.advanced.disableCancelling),
            disableRescheduling: getBoolean(advancedSource, ['disableRescheduling', 'disable_rescheduling'], defaults.advanced.disableRescheduling),
            sendTranscription: getBoolean(advancedSource, ['sendTranscription', 'send_transcription'], defaults.advanced.sendTranscription),
            autoTranslate: getBoolean(advancedSource, ['autoTranslate', 'auto_translate'], defaults.advanced.autoTranslate),
            interfaceLanguage: getBoolean(advancedSource, ['interfaceLanguage', 'interface_language'], defaults.advanced.interfaceLanguage),
            requiresEmailVerification: getBoolean(advancedSource, ['requiresEmailVerification', 'requires_email_verification'], defaults.advanced.requiresEmailVerification),
            hideNotesInCalendar: getBoolean(advancedSource, ['hideNotesInCalendar', 'hide_notes_in_calendar'], defaults.advanced.hideNotesInCalendar),
        },
        recurring: {
            recurringEvent: getBoolean(recurringSource, ['recurringEvent', 'recurring_event'], defaults.recurring.recurringEvent),
        },
    };
}

export function toApiEventTypeSettings(settings: EventTypeSettings): Record<string, unknown> {
    return {
        allow_multiple_durations: settings.allowMultipleDurations,
        limits: {
            before_event_buffer: settings.limits.beforeEventBuffer,
            after_event_buffer: settings.limits.afterEventBuffer,
            minimum_notice_value: settings.limits.minimumNoticeValue,
            minimum_notice_unit: settings.limits.minimumNoticeUnit,
            slot_interval: settings.limits.slotInterval,
            limit_frequency: settings.limits.limitFrequency,
            first_slot_only: settings.limits.firstSlotOnly,
            limit_total_duration: settings.limits.limitTotalDuration,
            limit_upcoming_per_booker: settings.limits.limitUpcomingPerBooker,
        },
        advanced: {
            calendar_event_name: settings.advanced.calendarEventName,
            calendar_account: settings.advanced.calendarAccount,
            layout_month: settings.advanced.layoutMonth,
            layout_weekly: settings.advanced.layoutWeekly,
            layout_column: settings.advanced.layoutColumn,
            default_view: settings.advanced.defaultView,
            confirmation_mode: settings.advanced.confirmationMode,
            booking_questions: settings.advanced.bookingQuestions.map((question) => ({
                id: question.id,
                label: question.label,
                typeLabel: question.typeLabel,
                status: question.status,
                enabled: question.enabled,
            })),
            require_cancellation_reason: settings.advanced.requireCancellationReason,
            requires_confirmation: settings.advanced.requiresConfirmation,
            disable_cancelling: settings.advanced.disableCancelling,
            disable_rescheduling: settings.advanced.disableRescheduling,
            send_transcription: settings.advanced.sendTranscription,
            auto_translate: settings.advanced.autoTranslate,
            interface_language: settings.advanced.interfaceLanguage,
            requires_email_verification: settings.advanced.requiresEmailVerification,
            hide_notes_in_calendar: settings.advanced.hideNotesInCalendar,
        },
        recurring: {
            recurring_event: settings.recurring.recurringEvent,
        },
    };
}

function stableSortObject(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(stableSortObject);
    }
    if (value && typeof value === 'object') {
        const source = value as Record<string, unknown>;
        const sortedKeys = Object.keys(source).sort();
        const result: Record<string, unknown> = {};
        for (const key of sortedKeys) {
            result[key] = stableSortObject(source[key]);
        }
        return result;
    }
    return value;
}

export function stableStringify(value: unknown): string {
    return JSON.stringify(stableSortObject(value));
}
