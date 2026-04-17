import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../stores/bookingStore';
import { BookingRow } from '../components/bookings/BookingRow';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { seedBookings } from '../data/seed';
import RequestRescheduleDialog from '../components/bookings/RequestRescheduleDialog';

const TABS = [
    { id: 'upcoming', label: 'Upcoming', serverStatus: 'upcoming' },
    { id: 'unconfirmed', label: 'Unconfirmed', serverStatus: 'unconfirmed' },
    { id: 'recurring', label: 'Recurring', serverStatus: 'recurring' },
    { id: 'past', label: 'Past', serverStatus: 'past' },
    { id: 'cancelled', label: 'Canceled', serverStatus: 'cancelled' },
];

const FILTER_OPTIONS = [
    { key: 'event_type', label: 'Event Type' },
    { key: 'team', label: 'Team' },
    { key: 'member', label: 'Member' },
    { key: 'attendee_name', label: 'Attendees Name' },
    { key: 'attendee_email', label: 'Attendee Email' },
    { key: 'date_range', label: 'Date Range' },
    { key: 'booking_uid', label: 'Booking UID' },
] as const;

type FilterKey = (typeof FILTER_OPTIONS)[number]['key'];

type BookingFilters = {
    event_type?: string;
    team?: string;
    member?: string;
    attendee_name?: string;
    attendee_email?: string;
    date_from?: string;
    date_to?: string;
    booking_uid?: string;
};

type FilterDraftState = {
    event_type: string;
    team: string;
    member: string;
    attendee_name: string;
    attendee_email: string;
    booking_uid: string;
    date_from: string;
    date_to: string;
};

const EMPTY_FILTER_DRAFT: FilterDraftState = {
    event_type: '',
    team: '',
    member: '',
    attendee_name: '',
    attendee_email: '',
    booking_uid: '',
    date_from: '',
    date_to: '',
};

function getSeedBookingsForStatus(serverStatus: string) {
    if (serverStatus === 'all') return seedBookings;
    if (serverStatus === 'cancelled') return seedBookings.filter((booking) => booking.status === 'cancelled');
    if (serverStatus === 'past') return seedBookings.filter((booking) => booking.status === 'past');
    if (serverStatus === 'upcoming') {
        return seedBookings.filter((booking) => booking.status === 'upcoming');
    }
    if (serverStatus === 'unconfirmed') {
        return seedBookings.filter((booking) => booking.status === 'rescheduled' || booking.rescheduleRequested);
    }
    if (serverStatus === 'recurring') {
        return seedBookings.filter((booking) => booking.eventTitle.toLowerCase().includes('recurring'));
    }
    return seedBookings;
}

export function BookingsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterSearch, setFilterSearch] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<FilterKey>('event_type');
    const [filterDraft, setFilterDraft] = useState<FilterDraftState>(EMPTY_FILTER_DRAFT);
    const [appliedFilters, setAppliedFilters] = useState<BookingFilters>({});
    const panelRef = useRef<HTMLDivElement | null>(null);
    const {
        bookings,
        total,
        hasMore,
        hasLoadedFromServer,
        fetchFromServer,
        cancelBooking,
        requestReschedule,
        rescheduleBooking,
        updateLocation,
        addGuests,
        markNoShow,
        reportBooking,
    } = useBookingStore();

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            const target = event.target as Node;
            if (panelRef.current && !panelRef.current.contains(target)) {
                setFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const active = useMemo(() => TABS.find((tab) => tab.id === activeTab), [activeTab]);

    useEffect(() => {
        void fetchFromServer(active?.serverStatus || 'upcoming', appliedFilters, {
            page: currentPage,
            page_size: rowsPerPage,
        });
    }, [active, appliedFilters, currentPage, rowsPerPage, fetchFromServer]);

    const matchingFilterOptions = useMemo(() => {
        const q = filterSearch.trim().toLowerCase();
        if (!q) return FILTER_OPTIONS;
        return FILTER_OPTIONS.filter((option) => option.label.toLowerCase().includes(q));
    }, [filterSearch]);

    const appliedFilterCount = useMemo(() => {
        let count = 0;
        for (const value of Object.values(appliedFilters)) {
            if (value && String(value).trim().length > 0) {
                count += 1;
            }
        }
        return count;
    }, [appliedFilters]);

    const seedFallbackBookings = useMemo(() => {
        return getSeedBookingsForStatus(active?.serverStatus || 'upcoming');
    }, [active]);

    const showSeedFallback = !hasLoadedFromServer && (!bookings || bookings.length === 0);
    const visibleBookings = showSeedFallback ? seedFallbackBookings : (bookings || []);
    const visibleTotal = showSeedFallback ? seedFallbackBookings.length : total;
    const visibleHasMore = showSeedFallback ? false : hasMore;

    function buildFiltersFromDraft(draft: FilterDraftState): BookingFilters {
        return {
            event_type: draft.event_type || undefined,
            team: draft.team || undefined,
            member: draft.member || undefined,
            attendee_name: draft.attendee_name || undefined,
            attendee_email: draft.attendee_email || undefined,
            booking_uid: draft.booking_uid || undefined,
            date_from: draft.date_from || undefined,
            date_to: draft.date_to || undefined,
        };
    }

    function applyFilters() {
        const nextFilters = buildFiltersFromDraft(filterDraft);
        setAppliedFilters(nextFilters);
        setCurrentPage(1);
        setFilterOpen(false);
    }

    function clearFilters() {
        setFilterDraft(EMPTY_FILTER_DRAFT);
        setAppliedFilters({});
        setCurrentPage(1);
        setFilterOpen(false);
    }

    async function refreshActiveTab() {
        await fetchFromServer(active?.serverStatus || 'upcoming', appliedFilters, {
            page: currentPage,
            page_size: rowsPerPage,
        });
    }

    const fromResult = visibleTotal === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const toResult = visibleTotal === 0 ? 0 : Math.min(currentPage * rowsPerPage, visibleTotal);

    async function handleReschedule(id: string) {
        const nextDate = window.prompt('Reschedule date (YYYY-MM-DD):');
        if (!nextDate) return;
        const nextStart = window.prompt('Reschedule start time (HH:mm):');
        if (!nextStart) return;
        try {
            await rescheduleBooking(id, { date: nextDate, start_time: nextStart });
            await refreshActiveTab();
        } catch {
            window.alert('Could not reschedule booking. The selected slot may already be booked.');
        }
    }

    const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
    const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
    const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

    function handleRequestReschedule(id: string) {
        setRescheduleBookingId(id);
        setRescheduleDialogOpen(true);
    }

    async function performRequestReschedule(message?: string) {
        if (!rescheduleBookingId) return;
        try {
            setRescheduleSubmitting(true);
            await requestReschedule(rescheduleBookingId, message);
            await refreshActiveTab();
        } catch (err) {
            console.error('request reschedule failed', err);
            window.alert('Could not request a reschedule.');
        } finally {
            setRescheduleSubmitting(false);
            setRescheduleDialogOpen(false);
            setRescheduleBookingId(null);
        }
    }

    async function handleEditLocation(id: string) {
        const booking = bookings.find((row) => row.id === id);
        const current = booking?.location || 'Cal Video';
        const nextLocation = window.prompt('Enter booking location:', current);
        if (!nextLocation) return;
        await updateLocation(id, nextLocation);
        await refreshActiveTab();
    }

    async function handleAddGuests(id: string) {
        const input = window.prompt('Add guest emails (comma separated):');
        if (!input) return;
        const guests = input.split(',').map((value) => value.trim()).filter(Boolean);
        if (guests.length === 0) return;
        await addGuests(id, guests);
        await refreshActiveTab();
    }

    async function handleReport(id: string) {
        const reason = window.prompt('Why are you reporting this booking?');
        if (!reason) return;
        await reportBooking(id, reason);
        await refreshActiveTab();
    }

    async function handleCancel(id: string) {
        const ok = window.confirm('Cancel this event?');
        if (!ok) return;
        await cancelBooking(id);
        await refreshActiveTab();
    }

    async function handleMarkNoShow(id: string) {
        await markNoShow(id);
        await refreshActiveTab();
    }

    return (
        <Shell>
            <div className="mx-auto w-full max-w-[1060px]">
                <PageHeader
                    title="Bookings"
                    subtitle="See upcoming and past events booked through your event type links."
                />

                <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <Tabs
                        tabs={TABS}
                        activeTab={activeTab}
                        onChange={(tabId) => {
                            setActiveTab(tabId);
                            setCurrentPage(1);
                        }}
                        className="w-full overflow-auto border border-[#252a36] bg-[#0d1017] xl:w-auto"
                    />
                    <div className="flex items-center justify-between gap-3 xl:justify-end" ref={panelRef}>
                    <div className="relative">
                            <button
                                type="button"
                                onClick={() => setFilterOpen((value) => !value)}
                                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#252a36] bg-[#0d1017] px-4 text-sm font-medium text-[#e4e7ee] hover:bg-[#141925]"
                            >
                                <SlidersHorizontal size={15} />
                                Filter
                                {appliedFilterCount > 0 ? (
                                    <span className="rounded-md bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-900">{appliedFilterCount}</span>
                                ) : null}
                            </button>

                            {filterOpen && (
                                <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[300px] overflow-hidden rounded-xl border border-[#2a3142] bg-[#0f1420] text-[#dbe2f0] shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
                                    <div className="border-b border-[#2a3142] p-3">
                                        <input
                                            value={filterSearch}
                                            onChange={(event) => setFilterSearch(event.target.value)}
                                            className="h-9 w-full rounded-lg border border-[#35405a] bg-[#111a2c] px-3 text-sm text-[#dbe2f0] outline-none placeholder:text-[#7f8aa5] focus:border-[#4a5a7e]"
                                            placeholder="Search"
                                        />
                                    </div>

                                    <div className="max-h-[220px] overflow-auto py-2">
                                        {matchingFilterOptions.map((option) => (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => setSelectedFilter(option.key)}
                                                className={`w-full px-4 py-2 text-left text-sm ${selectedFilter === option.key ? 'bg-[#18233a] font-medium text-[#f0f4ff]' : 'text-[#c3ccdf] hover:bg-[#152036]'}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="border-t border-[#2a3142] p-3">
                                        {selectedFilter === 'date_range' ? (
                                            <div className="space-y-2">
                                                <label className="text-xs text-[#8f9bb3]">From</label>
                                                <input
                                                    type="date"
                                                    value={filterDraft.date_from}
                                                    onChange={(event) => setFilterDraft((prev) => ({ ...prev, date_from: event.target.value }))}
                                                    className="h-9 w-full rounded-lg border border-[#35405a] bg-[#111a2c] px-2 text-sm text-[#dbe2f0]"
                                                />
                                                <label className="text-xs text-[#8f9bb3]">To</label>
                                                <input
                                                    type="date"
                                                    value={filterDraft.date_to}
                                                    onChange={(event) => setFilterDraft((prev) => ({ ...prev, date_to: event.target.value }))}
                                                    className="h-9 w-full rounded-lg border border-[#35405a] bg-[#111a2c] px-2 text-sm text-[#dbe2f0]"
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="mb-1 block text-xs text-[#8f9bb3]">
                                                    {FILTER_OPTIONS.find((option) => option.key === selectedFilter)?.label}
                                                </label>
                                                <input
                                                    value={filterDraft[selectedFilter as keyof FilterDraftState]}
                                                    onChange={(event) =>
                                                        setFilterDraft((prev) => ({
                                                            ...prev,
                                                            [selectedFilter]: event.target.value,
                                                        }))
                                                    }
                                                    className="h-9 w-full rounded-lg border border-[#35405a] bg-[#111a2c] px-3 text-sm text-[#dbe2f0] outline-none placeholder:text-[#7f8aa5] focus:border-[#4a5a7e]"
                                                    placeholder="Type to filter..."
                                                />
                                            </div>
                                        )}

                                        <div className="mt-3 flex items-center justify-between">
                                            <button type="button" className="text-sm text-[#9aa8c2]" onClick={clearFilters}>Clear</button>
                                            <button type="button" className="rounded-md bg-[#f5f8ff] px-3 py-1.5 text-sm font-medium text-[#0b1020]" onClick={applyFilters}>Apply</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#252a36] bg-[#0d1017] px-4 text-sm font-medium text-[#e4e7ee] hover:bg-[#141925]"
                        >
                            <ChevronDown size={15} />
                            Saved filters
                        </button>
                    </div>
                </div>

                <Card noPadding className="rounded-2xl border border-[#252a36] bg-gradient-to-br from-[#10141f] to-[#0c0f17] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
                    <div className="border-b border-[#232735] px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f9bb3]">
                        Next
                    </div>
                    {visibleBookings.length === 0 ? (
                        <div className="px-6 py-16 text-center text-sm text-[#8f9bb3]">
                            No bookings found for this filter.
                        </div>
                    ) : (
                        visibleBookings.map((booking, index) => (
                            <div key={booking.id} className={index !== 0 ? 'border-t border-[#232735]' : undefined}>
                                <BookingRow
                                    {...booking}
                                    onClickBooking={(id) => navigate(`/bookings/${id}`)}
                                    onJoin={(id) => navigate(`/bookings/${id}/join`)}
                                    onReschedule={handleReschedule}
                                            onRequestReschedule={handleRequestReschedule}
                                    onEditLocation={handleEditLocation}
                                    onAddGuests={handleAddGuests}
                                    onMarkNoShow={handleMarkNoShow}
                                    onReport={handleReport}
                                    onCancel={handleCancel}
                                />
                            </div>
                        ))
                    )}
                    <div className="flex items-center justify-between border-t border-[#232735] px-6 py-4 text-sm text-[#8f9bb3]">
                        <div className="flex items-center gap-2">
                            <select
                                value={rowsPerPage}
                                onChange={(event) => {
                                    setRowsPerPage(Number(event.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-lg border border-[#2a3040] bg-[#111623] px-3 py-1.5 text-[#dbe2f0] outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>rows per page</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span>{visibleTotal > 0 ? `${fromResult}-${toResult} of ${visibleTotal}` : '0 results'}</span>
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                className="rounded-md border border-[#2a3040] px-2.5 py-1 text-[#dbe2f0] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                disabled={!visibleHasMore}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                className="rounded-md border border-[#2a3040] px-2.5 py-1 text-[#dbe2f0] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </Card>
                <RequestRescheduleDialog
                    open={rescheduleDialogOpen}
                    onClose={() => setRescheduleDialogOpen(false)}
                    onConfirm={async (message?: string) => await performRequestReschedule(message)}
                    submitting={rescheduleSubmitting}
                />
            </div>
        </Shell>
    );
}
