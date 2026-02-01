import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Episodes from './Episodes';
import Podcast from './Podcast';
import Trio from './Trio';
import Contact from './Contact';

export default function Router() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/episodes" element={<Episodes />} />
        <Route path="/podcast" element={<Podcast />} />
        <Route path="/trio" element={<Trio />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}
