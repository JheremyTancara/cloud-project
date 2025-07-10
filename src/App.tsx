import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import GenrePage from './components/GenrePage';
import ArtistPage from './components/ArtistPage';
import AdminPanel from './components/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthLayout />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/genre/:genreId" element={<GenrePage />} />
        <Route path="/artist/:artistId" element={<ArtistPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        {/* Ruta catch-all para redirigir a login si no existe */}
        <Route path="*" element={<AuthLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
