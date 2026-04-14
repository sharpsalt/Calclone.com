import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EventTypesPage } from './pages/EventTypesPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { BookingsPage } from './pages/BookingsPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { PublicBookingPage } from './pages/PublicBookingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes */}
        <Route path="/" element={<Navigate to="/event-types" replace />} />
        <Route path="/event-types" element={<EventTypesPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/bookings" element={<BookingsPage />} />

        {/* Public routes */}
        <Route path="/:username" element={<PublicProfilePage />} />
        <Route path="/:username/:slug" element={<PublicBookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
