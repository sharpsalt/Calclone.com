import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const bookingQuestionSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(200),
  typeLabel: z.string().min(1).max(120),
  status: z.enum(['Required', 'Optional', 'Hidden']),
  enabled: z.boolean(),
});

const eventTypeSettingsSchema = z.object({
  allow_multiple_durations: z.boolean().optional(),
  limits: z.object({
    before_event_buffer: z.string().max(80).optional(),
    after_event_buffer: z.string().max(80).optional(),
    minimum_notice_value: z.number().int().min(0).max(100000).optional(),
    minimum_notice_unit: z.string().max(30).optional(),
    slot_interval: z.string().max(80).optional(),
    limit_frequency: z.boolean().optional(),
    first_slot_only: z.boolean().optional(),
    limit_total_duration: z.boolean().optional(),
    limit_upcoming_per_booker: z.boolean().optional(),
  }).partial().optional(),
  advanced: z.object({
    calendar_event_name: z.string().max(300).optional(),
    calendar_account: z.string().max(200).optional(),
    layout_month: z.boolean().optional(),
    layout_weekly: z.boolean().optional(),
    layout_column: z.boolean().optional(),
    default_view: z.enum(['Month', 'Weekly', 'Column']).optional(),
    confirmation_mode: z.enum(['Email', 'Phone']).optional(),
    booking_questions: z.array(bookingQuestionSchema).max(100).optional(),
    require_cancellation_reason: z.string().max(120).optional(),
    requires_confirmation: z.boolean().optional(),
    disable_cancelling: z.boolean().optional(),
    disable_rescheduling: z.boolean().optional(),
    send_transcription: z.boolean().optional(),
    auto_translate: z.boolean().optional(),
    interface_language: z.boolean().optional(),
    requires_email_verification: z.boolean().optional(),
    hide_notes_in_calendar: z.boolean().optional(),
  }).partial().optional(),
  recurring: z.object({
    recurring_event: z.boolean().optional(),
  }).partial().optional(),
}).partial();

export const createEventTypeSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().default(''),
  duration_minutes: z.number().int().min(1).max(1440),
  slug: z.string().min(1).max(200).regex(slugRegex, 'slug must be kebab-case'),
  is_active: z.boolean().optional(),
  settings: eventTypeSettingsSchema.optional(),
});

export const updateEventTypeSchema = createEventTypeSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field must be provided',
  });
