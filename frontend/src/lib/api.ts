const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path: string, opts: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (!res.ok) {
    const text = await res.text();
    // try to parse JSON error body and throw a friendly message
    try {
      const json = JSON.parse(text);
      const message = json?.error || json?.message || text;
      const err: any = new Error(String(message));
      err.status = res.status;
      err.body = json;
      throw err;
    } catch (e) {
      const err: any = new Error(`API error ${res.status}: ${text}`);
      err.status = res.status;
      throw err;
    }
  }
  if (res.status === 204) return null;
  return res.json();
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }
  const output = query.toString();
  return output ? `?${output}` : '';
}

// Event Types
export const fetchEventTypes = () => request('/api/event-types');
export const fetchFeatureFlags = () => request('/api/feature-flags');
export const createEventType = (data: any) => request('/api/event-types', { method: 'POST', body: JSON.stringify(data) });
export const updateEventType = (id: string, data: any) => request(`/api/event-types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEventType = (id: string) => request(`/api/event-types/${id}`, { method: 'DELETE' });
export const fetchEventTypeBySlug = (slug: string, opts: RequestInit = {}) => request(`/api/event-types/slug/${slug}`, opts);
export const fetchPublicProfile = (username: string, opts: RequestInit = {}) => request(`/api/event-types/public/${encodeURIComponent(username)}`, opts);

// Availability
export const fetchAvailability = () => request('/api/availability');
export const saveAvailability = (data: any) => request('/api/availability', { method: 'POST', body: JSON.stringify(data) });
export const fetchSchedules = () => request('/api/availability/schedules');
export const createSchedule = (data: any) => request('/api/availability/schedules', { method: 'POST', body: JSON.stringify(data) });
export const fetchSchedule = (id: string) => request(`/api/availability/schedules/${id}`);
export const updateSchedule = (id: string, data: any) => request(`/api/availability/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSchedule = (id: string) => request(`/api/availability/schedules/${id}`, { method: 'DELETE' });

// Bookings
export const createBooking = (data: any) => request('/api/bookings', { method: 'POST', body: JSON.stringify(data) });
export const fetchBookingSlots = (eventTypeId: string, date: string) =>
  request(`/api/bookings/slots${toQueryString({ event_type_id: eventTypeId, date })}`);

// Public tokenized booking management (no auth required)
export const publicGetBookingByToken = (token: string) => request(`/api/public/manage/${encodeURIComponent(token)}`);
export const publicCancelByToken = (token: string) => request(`/api/public/manage/${encodeURIComponent(token)}/cancel`, { method: 'POST' });
export const publicRescheduleByToken = (token: string, date: string, start_time: string) =>
  request(`/api/public/manage/${encodeURIComponent(token)}/reschedule`, { method: 'POST', body: JSON.stringify({ date, start_time }) });

export const fetchBookings = (
  status = 'upcoming',
  filters?: {
    event_type?: string;
    team?: string;
    member?: string;
    attendee_name?: string;
    attendee_email?: string;
    date_from?: string;
    date_to?: string;
    booking_uid?: string;
  },
  pagination?: {
    page?: number;
    page_size?: number;
  }
) => request(`/api/bookings${toQueryString({ status, ...(filters || {}), ...(pagination || {}) })}`).then((payload: any) => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      page_size: payload.length || 10,
      has_more: false,
    };
  }
  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    total: Number(payload?.total || 0),
    page: Number(payload?.page || 1),
    page_size: Number(payload?.page_size || 10),
    has_more: Boolean(payload?.has_more),
  };
});

export const fetchBooking = (id: string) => request(`/api/bookings/${id}`);
export const cancelBooking = (id: string) => request(`/api/bookings/${id}`, { method: 'DELETE' });
export const requestBookingReschedule = (id: string, message?: string) =>
  request(`/api/bookings/${id}/request-reschedule`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
export const rescheduleBooking = (id: string, data: { date: string; start_time: string }) =>
  request(`/api/bookings/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const updateBookingLocation = (id: string, location: string) =>
  request(`/api/bookings/${id}/location`, {
    method: 'PUT',
    body: JSON.stringify({ location }),
  });
export const addBookingGuests = (id: string, guests: string[]) =>
  request(`/api/bookings/${id}/guests`, {
    method: 'POST',
    body: JSON.stringify({ guests }),
  });
export const markBookingNoShow = (id: string) =>
  request(`/api/bookings/${id}/no-show`, {
    method: 'POST',
  });
export const reportBooking = (id: string, reason: string) =>
  request(`/api/bookings/${id}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

// Avatar / Emails
export const uploadAvatar = async (id: string, file: File) => {
  const url = `${API_BASE}/api/users/${id}/avatar`;
  const fd = new FormData();
  fd.append('avatar', file);
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Upload failed');
  }
  return res.json();
};

export const deleteAvatar = (id: string) => request(`/api/users/${id}/avatar`, { method: 'DELETE' });

export const listEmails = (id: string) => request(`/api/users/${id}/emails`);
export const addEmail = (id: string, email: string) => request(`/api/users/${id}/emails`, { method: 'POST', body: JSON.stringify({ email }) });
export const removeEmail = (id: string, email: string) => request(`/api/users/${id}/emails/${encodeURIComponent(email)}`, { method: 'DELETE' });
export const setPrimaryEmail = (id: string, email: string) => request(`/api/users/${id}/emails/${encodeURIComponent(email)}/primary`, { method: 'POST' });

// User
export const fetchCurrentUser = () => request('/api/users/me');
export const updateUserById = (id: string, data: any) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export default {
  fetchEventTypes, createEventType, updateEventType, deleteEventType,
  fetchEventTypeBySlug, fetchPublicProfile,
  fetchAvailability, saveAvailability,
  fetchSchedules, createSchedule, fetchSchedule, updateSchedule, deleteSchedule,
  createBooking, fetchBookingSlots, fetchBookings, fetchBooking,
  cancelBooking, requestBookingReschedule, rescheduleBooking,
  updateBookingLocation, addBookingGuests, markBookingNoShow, reportBooking,
  publicGetBookingByToken, publicCancelByToken, publicRescheduleByToken,
  fetchCurrentUser, updateUserById,
  uploadAvatar, deleteAvatar, listEmails, addEmail, removeEmail, setPrimaryEmail,
};
