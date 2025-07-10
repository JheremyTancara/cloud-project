import React, { useState } from 'react';
import './Header.css';
import { signOut } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, query, orderBy, limit, collection } from 'firebase/firestore';
import { auth, db, getTopSongs } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const token = 'BQBqZ-npl5oRZdmkFrQ_zPr5fzfKgGDehKBwYRVY79XNBT1EPiz4vDYLZxUG8ut_BrJfdJNZ32g7RSx8FyjZvZGegk0mlNBqDSsWykNNo58dQUSSgnu_Nc-FUO1dbrLTvFDeGRG30injtOr2w3JIwzOaMsAuJNRAuJ-_vweIO4iaI-hZKq16DxaSJQUgMXlpFMLgcSR4BrjvEnSYJ5KCT-F1hRF6QozBlqyLGdKVNXVu9W49FSX0JAjDxzkVPcjJqOACaikxbetv4SpyRJ6-2qpFFJ5MuIEGR2ZzS1_-Uaa4VQPk2I6N_12qsRGkhNP8';

async function fetchWebApi(endpoint: string, method: string, body?: unknown) {
  const options: RequestInit = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`https://api.spotify.com/${endpoint}`, options);
  return await res.json();
}

async function getTopTracks() {
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
}

interface Song {
  id: string;
  name: string;
  playCount: number;
}

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [showTracks, setShowTracks] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    let unsub: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        unsub = onSnapshot(userRef, (snap) => {
          setProfileImg(snap.data()?.imageUrl || null);
        });
      } else {
        setProfileImg(null);
        if (unsub) unsub();
      }
    });
    return () => {
      unsubscribe();
      if (unsub) unsub();
    };
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('playCount', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setTopSongs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
    });
    return () => unsub();
  }, []);

  const handleMenuToggle = () => setMenuOpen((open) => !open);

  const handleShowTopTracks = () => {
    setShowTracks(true);
    setLoadingTracks(false);
  };

  const handleCloseTracks = () => {
    setShowTracks(false);
    setTopTracks([]);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleProfile = () => {
    setMenuOpen(false);
    navigate('/profile');
  };

  return (
    <header className="jalafy-header">
      <div className="jalafy-header-left">
        <span className="jalafy-logo">Jalafy</span>
      </div>
      <div className="jalafy-header-right">
        <button className="jalafy-toptracks-btn" onClick={handleShowTopTracks}>
          Top 5 canciones
        </button>
        <div className="jalafy-user-menu-wrapper">
          <button className="jalafy-user-btn" onClick={handleMenuToggle}>
            {profileImg ? (
              <img src={profileImg} alt="profile" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1DB954' }} />
            ) : (
              <span className="jalafy-user-icon">👤</span>
            )}
          </button>
          {menuOpen && (
            <div className="jalafy-user-dropdown">
              <button className="jalafy-dropdown-item" onClick={handleProfile}>Ver perfil</button>
              <button className="jalafy-dropdown-item" onClick={handleLogout}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>
      {showTracks && (
        <div className="jalafy-toptracks-modal">
          <div className="jalafy-toptracks-content">
            <h3>Top 5 canciones más escuchadas</h3>
            {loadingTracks ? (
              <div className="jalafy-loading">Cargando...</div>
            ) : (
              <ul>
                {topSongs.map((song, idx) => (
                  <li key={song.id}>
                    {idx + 1}. {song.name} <span className="jalafy-artist">({song.playCount} plays)</span>
                  </li>
                ))}
              </ul>
            )}
            <button className="jalafy-close-btn" onClick={handleCloseTracks}>Cerrar</button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 