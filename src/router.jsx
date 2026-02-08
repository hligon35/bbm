import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Episodes from './Episodes';
import Podcast from './Podcast';
import Trio from './Trio';
import Contact from './Contact';
import ScheduleInvitePage from './schedule/ScheduleInvitePage';
import AdminPage from './schedule/AdminPage';

export default function Router() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/episodes" element={<Episodes />} />
        <Route path="/podcast" element={<Podcast />} />
        <Route path="/trio" element={<Trio />} />
        <Route path="/contact" element={<Contact />} />
        {/* Hidden admin login route (intentionally not linked in navigation) */}
        <Route path="/admin" element={<AdminPage />} />
        {/* Hidden invite-only route (intentionally not linked in navigation) */}
        <Route path="/schedule/:token" element={<ScheduleInvitePage />} />
        {/* Hidden admin route (intentionally not linked in navigation) */}
        <Route path="/schedule/admin" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
