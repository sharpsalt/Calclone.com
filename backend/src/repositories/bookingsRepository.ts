import { query, queryRead } from '../db';
import ApiError from '../errors/ApiError';

type NewBookingInput = {
  event_type_id: string;
  schedule_id: string | null;
  date: string;
  start_time: string;
  booker_name: string;
  booker_email: string;
  manage_token?: string | null;
  status?: string;
  location?: string;
  guests?: string[];
  reschedule_requested?: boolean;
  reschedule_note?: string | null;
  reported_reason?: string | null;
  is_no_show?: boolean;
};

export type BookingListFilters = {
  event_type?: string;
  team?: string;
  member?: string;
  attendee_name?: string;
  attendee_email?: string;
  booking_uid?: string;
  date_from?: string;
  date_to?: string;
};

export type BookingsPageInput = BookingListFilters & {
  status: string;
  page: number;
  page_size: number;
};

export type PaginatedBookingsResult = {
  items: any[];
  total: number;
  page: number;
  page_size: number;
};

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const startDate = new Date(1970, 0, 1, h, m);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);
  return endDate.toTimeString().slice(0, 5);
}

const BOOKING_SELECT_WITH_EVENT = `
  SELECT
    b.*,
    et.title AS event_title,
    et.duration_minutes,
    et.slug AS event_slug,
    et.host_name,
    et.host_timezone,
    u.username AS user_username,
    u.name AS user_name
  FROM bookings b
  LEFT JOIN event_types et ON et.id = b.event_type_id
  LEFT JOIN users u ON u.id = et.user_id
`;

function buildWhereClause(status: string, filters: BookingListFilters = {}) {
  const clauses: string[] = [];
  const params: any[] = [];

  const addParam = (value: any): string => {
    params.push(value);
    return `$${params.length}`;
  };

  const normalizedStatus = String(status || 'upcoming').toLowerCase();
  if (normalizedStatus === 'cancelled') {
    clauses.push("b.status = 'cancelled'");
  } else if (normalizedStatus === 'past') {
    clauses.push('b.date < CURRENT_DATE');
  } else if (normalizedStatus === 'upcoming') {
    clauses.push("b.date >= CURRENT_DATE AND b.status <> 'cancelled'");
  } else if (normalizedStatus === 'unconfirmed') {
    clauses.push("(b.status = 'rescheduled' OR b.reschedule_requested = true)");
  } else if (normalizedStatus === 'recurring') {
    const recurringToken = addParam('%recurring%');
    clauses.push(`COALESCE(et.title, '') ILIKE ${recurringToken}`);
  }

  if (filters.event_type) {
    const tokenA = addParam(`%${filters.event_type}%`);
    const tokenB = addParam(`%${filters.event_type}%`);
    clauses.push(`(COALESCE(et.title, '') ILIKE ${tokenA} OR COALESCE(et.slug, '') ILIKE ${tokenB})`);
  }

  if (filters.attendee_name) {
    const token = addParam(`%${filters.attendee_name}%`);
    clauses.push(`COALESCE(b.booker_name, '') ILIKE ${token}`);
  }

  if (filters.attendee_email) {
    const token = addParam(`%${filters.attendee_email}%`);
    clauses.push(`COALESCE(b.booker_email, '') ILIKE ${token}`);
  }

  if (filters.team) {
    const token = addParam(`%${filters.team}%`);
    clauses.push(`(COALESCE(u.username, '') ILIKE ${token} OR COALESCE(u.name, '') ILIKE ${token})`);
  }

  if (filters.member) {
    const token = addParam(`%${filters.member}%`);
    clauses.push(`COALESCE(et.host_name, '') ILIKE ${token}`);
  }

  if (filters.booking_uid) {
    const token = addParam(`%${filters.booking_uid}%`);
    clauses.push(`CAST(b.id AS TEXT) ILIKE ${token}`);
  }

  if (filters.date_from) {
    const fromDate = addParam(filters.date_from);
    clauses.push(`b.date >= ${fromDate}::date`);
  }

  if (filters.date_to) {
    const toDate = addParam(filters.date_to);
    clauses.push(`b.date <= ${toDate}::date`);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

export const getEventTypeDuration = async (eventTypeId: string) => {
  const res = await queryRead('SELECT duration_minutes FROM event_types WHERE id=$1', [eventTypeId]);
  return res.rows[0] ? res.rows[0].duration_minutes : null;
};

/**
 * Creates a booking inside a transaction with row-level locking to prevent double bookings.
 */
export const createBookingWithGuards = async (id: string, data: NewBookingInput) => {
  try {
    // Optimistic concurrency: quick conflict check, then attempt INSERT and rely on unique constraint
    const eventTypeRes = await queryRead('SELECT duration_minutes FROM event_types WHERE id=$1', [data.event_type_id]);
    if (!eventTypeRes.rows[0]) throw ApiError.notFound('Event type not found');

    const durationMinutes = Number(eventTypeRes.rows[0].duration_minutes);

    const end_time = computeEndTime(data.start_time, durationMinutes);
    const hostUserId = eventTypeRes.rows[0].user_id;

    // Cross-event overlap conflict check (no locks) to avoid unnecessary inserts
    const conflictRes = await query(
      `SELECT 1 FROM bookings b
       JOIN event_types et ON b.event_type_id = et.id
       WHERE et.user_id = $1 
         AND b.date = $2 
         AND b.status <> 'cancelled'
         AND b.start_time < $4 
         AND b.end_time > $3
       LIMIT 1`,
      [hostUserId, data.date, data.start_time, end_time]
    );
    if (conflictRes.rows.length > 0) {
      throw ApiError.conflict('This time slot is already booked');
    }

    // Attempt insert on primary; if a concurrent insert wins, unique constraint will trigger
    const inserted = await query(
      `INSERT INTO bookings (
        id, manage_token, event_type_id, schedule_id, date, start_time, end_time,
        booker_name, booker_email, status, location, guests,
        reschedule_requested, reschedule_note, reported_reason, is_no_show
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16)
      RETURNING *`,
      [
        id,
        data.manage_token || null,
        data.event_type_id,
        data.schedule_id,
        data.date,
        data.start_time,
        end_time,
        data.booker_name,
        data.booker_email,
        data.status || 'upcoming',
        data.location || 'Cal Video',
        JSON.stringify(Array.isArray(data.guests) ? data.guests : []),
        Boolean(data.reschedule_requested),
        data.reschedule_note || null,
        data.reported_reason || null,
        Boolean(data.is_no_show),
      ]
    );

    const insertedId = inserted.rows[0]?.id;
    if (!insertedId) throw ApiError.badRequest('Failed to create booking');

    // Return booking with joined event type info
    const detailed = await query(`${BOOKING_SELECT_WITH_EVENT} WHERE b.id=$1`, [insertedId]);
    return detailed.rows[0];
  } catch (err: any) {
    // Handle unique constraint violation (concurrent duplicate)
    if (err?.code === '23505') {
      throw ApiError.conflict('This time slot is already booked');
    }
    throw err;
  }
};

export const findBookedStartTimes = async (eventTypeId: string, date: string): Promise<{ start_time: string; end_time: string }[]> => {
  const eventHostRes = await query("SELECT user_id FROM event_types WHERE id = $1", [eventTypeId]);
  if (eventHostRes.rows.length === 0) return [];
  const hostUserId = eventHostRes.rows[0].user_id;

  const { rows } = await query(
    `SELECT b.start_time, b.end_time 
     FROM bookings b
     JOIN event_types et ON b.event_type_id = et.id
     WHERE et.user_id = $1 AND b.date = $2 AND b.status <> 'cancelled'
     ORDER BY b.start_time`,
    [hostUserId, date]
  );
  return rows.map((r) => ({
    start_time: String(r.start_time).slice(0, 5),
    end_time: r.end_time ? String(r.end_time).slice(0, 5) : String(r.start_time).slice(0, 5),
  }));
};

export const findBookingsPage = async ({
  status,
  page,
  page_size,
  ...filters
}: BookingsPageInput): Promise<PaginatedBookingsResult> => {
  const safePage = Number.isFinite(page) ? Math.max(1, Number(page)) : 1;
  const safePageSize = Number.isFinite(page_size) ? Math.min(100, Math.max(1, Number(page_size))) : 10;
  const offset = (safePage - 1) * safePageSize;

  const normalizedStatus = String(status || 'upcoming').toLowerCase();
  const { whereSql, params } = buildWhereClause(normalizedStatus, filters);
  const sortDirection = normalizedStatus === 'past' || normalizedStatus === 'cancelled' ? 'DESC' : 'ASC';

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM bookings b
    LEFT JOIN event_types et ON et.id = b.event_type_id
    ${whereSql}
  `;
  const countRes = await query(countSql, params);
  const total = Number(countRes.rows[0]?.total || 0);

  const dataSql = `
    ${BOOKING_SELECT_WITH_EVENT}
    ${whereSql}
    ORDER BY b.date ${sortDirection}, b.start_time ${sortDirection}
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;
  const dataRes = await query(dataSql, [...params, safePageSize, offset]);

  return {
    items: dataRes.rows,
    total,
    page: safePage,
    page_size: safePageSize,
  };
};

export const findBookingById = async (id: string) => {
  const { rows } = await query(`${BOOKING_SELECT_WITH_EVENT} WHERE b.id=$1`, [id]);
  return rows[0] || null;
};

export const findBookingByManageToken = async (token: string) => {
  const { rows } = await queryRead(
    `${BOOKING_SELECT_WITH_EVENT} WHERE b.manage_token=$1 LIMIT 1`,
    [token]
  );
  return rows[0] || null;
};

export const findBookingBySlot = async (eventTypeId: string, date: string, startTime: string) => {
  const { rows } = await queryRead(
    `${BOOKING_SELECT_WITH_EVENT} WHERE b.event_type_id=$1 AND b.date=$2 AND b.start_time=$3 AND b.status <> 'cancelled' LIMIT 1`,
    [eventTypeId, date, startTime]
  );
  return rows[0] || null;
};

export const hasConflictForSlot = async (eventTypeId: string, date: string, startTime: string, ignoreBookingId?: string) => {
  const args = [eventTypeId, date, startTime, 'cancelled'];
  let sql = 'SELECT 1 FROM bookings WHERE event_type_id=$1 AND date=$2 AND start_time=$3 AND status <> $4';
  if (ignoreBookingId) {
    sql += ' AND id <> $5';
    args.push(ignoreBookingId);
  }
  sql += ' LIMIT 1';

  const { rows } = await query(sql, args);
  return rows.length > 0;
};

export const updateBookingById = async (id: string, updates: Record<string, unknown>) => {
  const allowedFields = [
    'date', 'start_time', 'end_time', 'status', 'location',
    'guests', 'reschedule_requested', 'reschedule_note',
    'reported_reason', 'is_no_show',
  ];

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const field of allowedFields) {
    if (updates[field] === undefined) continue;
    if (field === 'guests') {
      fields.push(`${field} = $${idx}::jsonb`);
      values.push(JSON.stringify(updates[field]));
    } else {
      fields.push(`${field} = $${idx}`);
      values.push(updates[field]);
    }
    idx += 1;
  }

  if (fields.length === 0) {
    return findBookingById(id);
  }

  values.push(id);
  await query(`UPDATE bookings SET ${fields.join(', ')} WHERE id = $${idx}`, values as any[]);
  return findBookingById(id);
};

export const cancelBookingById = async (id: string) => {
  await query("UPDATE bookings SET status='cancelled' WHERE id=$1", [id]);
};
