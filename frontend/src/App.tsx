import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EventTypesPage } from './pages/EventTypesPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { ScheduleEditorPage } from './pages/ScheduleEditorPage';
import { BookingsPage } from './pages/BookingsPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { PublicBookingPage } from './pages/PublicBookingPage';
import { ManageBookingPage } from './pages/ManageBookingPage';
import { OutOfOfficePage } from './pages/OutOfOfficePage';
import SettingsPage from './pages/SettingsPage';
import { Profile } from './pages/settings/Profile';
import Overview from './pages/settings/Overview';
import { General } from './pages/settings/General';
import { Calendars } from './pages/settings/Calendars';
import { Conferencing } from './pages/settings/Conferencing';
import { Appearance } from './pages/settings/Appearance';
import { OutOfOffice } from './pages/settings/OutOfOffice';
import { PushNotifications } from './pages/settings/PushNotifications';
import { Features } from './pages/settings/Features';
import { RoadmapPage } from './pages/RoadmapPage';
import { HelpPage } from './pages/HelpPage';
import { EventTypeEditorPage } from './pages/EventTypeEditorPage';
import { JoinCalVideoPage } from './pages/JoinCalVideoPage';
import { TimezoneSync } from './components/TimezoneSync';
import { GreetingModal } from './components/GreetingModal';
import { SearchModal } from './components/SearchModal';
import { useEffect } from 'react';
import { useSearchStore } from './stores/searchStore';
import { useEventTypeStore } from './stores/eventTypeStore';
import { useAvailabilityStore } from './stores/availabilityStore';
import { useFeatureFlagsStore } from './stores/featureFlagsStore';

function App() {
  const setSearchOpen = useSearchStore((s) => s.setOpen);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  // initial sync with backend if available
  const fetchEventTypes = useEventTypeStore((s) => s.fetchFromServer);
  const syncAvailability = useAvailabilityStore((s) => s.syncWithServer);
  const fetchFeatureFlags = useFeatureFlagsStore((s) => s.fetch);
  useEffect(() => {
    (async () => {
      try {
        await fetchEventTypes?.();
        await syncAvailability?.();
        await fetchFeatureFlags?.();
      } catch (err) {
        // ignore, keep seeded data
      }
    })();
  }, [fetchEventTypes, syncAvailability]);
  return (
    <BrowserRouter>
      <GreetingModal />
      <TimezoneSync />
      <SearchModal />
      <Routes>
        {/* Admin routes */}
        <Route path="/" element={<Navigate to="/event-types" replace />} />
        <Route path="/event-types" element={<EventTypesPage />} />
        <Route path="/event-types/:id" element={<EventTypeEditorPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/availability/schedules/:id" element={<ScheduleEditorPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/:id" element={<BookingDetailsPage />} />
        <Route path="/bookings/:id/join" element={<JoinCalVideoPage />} />
        <Route path="/settings" element={<SettingsPage />}>
          <Route index element={<Overview />} />
          <Route path="profile" element={<Profile />} />
          <Route path="general" element={<General />} />
          <Route path="calendars" element={<Calendars />} />
          <Route path="conferencing" element={<Conferencing />} />
          <Route path="appearance" element={<Appearance />} />
          <Route path="out-of-office" element={<OutOfOffice />} />
          <Route path="push-notifications" element={<PushNotifications />} />
          <Route path="features" element={<Features />} />
        </Route>
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/help" element={<HelpPage />} />

        {/* Public routes */}
        <Route path="/manage/:token" element={<ManageBookingPage />} />
        <Route path="/out-of-office" element={<OutOfOfficePage />} />
        <Route path="/:username" element={<PublicProfilePage />} />
        <Route path="/:username/:slug" element={<PublicBookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
