import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSongsByArtist, getArtistById } from '../firebaseConfig';
import type { Song, Artist } from '../types/music';
import '../styles/ArtistPage.css';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const ArtistPage: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState<Song | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (artistId) {
      getSongsByArtist(artistId).then(songs => setSongs(songs));
      getArtistById(artistId).then(found => { if (found) setArtist(found); });
    }
  }, [artistId]);

  if (!artist) return <div className="jalafy-artist-root">Loading...</div>;

  // Filtrado
  const filteredSongs = songs.filter(song =>
    song.name.toLowerCase().includes(search.toLowerCase())
  );

  // Duración total (simulada, puedes sumar los duration_ms si los tienes)
  const totalDuration = filteredSongs.length * 180; // 180s = 3min por canción (simulado)
  const totalDurationStr = `${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, '0')}`;

  // Incrementar playCount en Firestore
  const incrementPlayCount = async (songId: string) => {
    const songRef = doc(db, 'songs', songId);
    await updateDoc(songRef, { playCount: (songs.find(s => s.id === songId)?.playCount || 0) + 1 });
  };

  // Reproducir aleatorio
  const playRandom = async () => {
    if (filteredSongs.length === 0) return;
    const playable = filteredSongs.filter(s => s.audioUrl);
    if (playable.length === 0) return setShowAlert(true);
    const song = playable[Math.floor(Math.random() * playable.length)];
    setCurrent(song);
    await incrementPlayCount(song.id);
  };

  // Reproducir una canción
  const playSong = async (song: Song) => {
    if (!song.audioUrl) return setShowAlert(true);
    setCurrent(song);
    await incrementPlayCount(song.id);
  };

  return (
    <div className="jalafy-artist-root">
      <div className="jalafy-artist-card">
        {/* Header tipo Spotify */}
        <div className="jalafy-artist-header">
          {artist.imageUrl && (
            <img src={artist.imageUrl} alt={artist.name} className="jalafy-artist-img-large" />
          )}
          <div className="jalafy-artist-header-info">
            <h1 className="jalafy-title">{artist.name}</h1>
            <div className="jalafy-artist-stats">
              {filteredSongs.length} canciones · {totalDurationStr} min
            </div>
            <button className="jalafy-play-btn" onClick={playRandom}>Reproducir</button>
          </div>
        </div>
        <div className="jalafy-divider" />
        {/* Buscador */}
        <div className="jalafy-search-bar">
          <input
            type="text"
            placeholder="Buscar canción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {/* Tabla de canciones */}
        <div className="jalafy-songs-table">
          <div className="jalafy-songs-table-header">
            <span>#</span>
            <span>Imagen</span>
            <span>Título</span>
            <span>Artista</span>
            <span>Álbum</span>
            <span>Reproducciones</span>
          </div>
          {filteredSongs.map((song, idx) => (
            <div
              key={song.id}
              className="jalafy-songs-table-row"
              onClick={() => playSong(song)}
              style={{ cursor: song.audioUrl ? 'pointer' : 'not-allowed' }}
            >
              <span>{idx + 1}</span>
              <span>
                {song.imageUrl
                  ? <img src={song.imageUrl} alt={song.name} className="jalafy-song-img-circle" />
                  : <div className="jalafy-song-img-placeholder" />}
              </span>
              <span style={{ color: song.audioUrl ? '#fff' : '#888', opacity: song.audioUrl ? 1 : 0.5 }}>
                {song.name}
              </span>
              <span>{artist.name}</span>
              <span>{song.album || 'Single'}</span>
              <span>{song.playCount ?? 0}</span>
            </div>
          ))}
          {filteredSongs.length === 0 && (
            <div style={{ color: '#fff', margin: '2rem' }}>No hay canciones para este artista.</div>
          )}
        </div>
      </div>
      {/* Reproductor tipo barra inferior */}
      {current && (
        <div className="jalafy-player-bar" style={{marginTop: 64}}>
          {current.imageUrl && <img src={current.imageUrl} alt={current.name} className="jalafy-player-img" />}
          <div className="jalafy-player-info">
            <div>{current.name}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{artist.name}</div>
          </div>
          <audio
            controls
            src={current.audioUrl}
            autoPlay
            className="jalafy-player-audio"
            onEnded={() => setCurrent(null)}
          />
        </div>
      )}
      {/* Alerta si no hay mp3 */}
      {showAlert && (
        <div className="jalafy-alert">
          <span>Esta canción no tiene ningún mp3 vinculado.</span>
          <button onClick={() => setShowAlert(false)}>Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default ArtistPage; 