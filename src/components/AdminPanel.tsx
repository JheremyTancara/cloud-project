import React, { useState, useEffect, useRef } from 'react'
import { getGenres, addGenre, updateGenre, deleteGenre, getArtistsByGenre, addArtist, updateArtist, deleteArtist, getSongsByArtist, addSong, updateSong, deleteSong } from '../firebaseConfig';
import { uploadImageToCloudinary, uploadAudioToCloudinary } from '../utils/cloudinary';
import type { Genre, Artist, Song } from '../types/music';
import '../styles/AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { FaEdit } from 'react-icons/fa';

// Simulación de usuario especial (ahora cualquier usuario autenticado es admin)
const isAdmin = () => true;

// Popup/modal genérico
function EditModal({ open, onClose, children }: { open: any, onClose: any, children: any }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.classList.remove('modal-open');
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" ref={modalRef}>
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<'genres' | 'artists' | 'songs'>('genres');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Estados para modales y datos a editar
  const [editType, setEditType] = useState(null); // 'genre' | 'artist' | 'song'
  const [editData, setEditData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Estado global para muteo por canción
  const [mutedMap, setMutedMap] = useState<{ [id: string]: boolean }>({});
  const audioRefs = useRef<{ [id: string]: HTMLAudioElement | null }>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Cargar géneros
  useEffect(() => { getGenres().then(setGenres); }, []);
  // Cargar artistas al seleccionar género
  useEffect(() => {
    if (selectedGenre) getArtistsByGenre(selectedGenre.id).then(setArtists);
    else setArtists([]);
  }, [selectedGenre]);
  // Cargar canciones al seleccionar artista
  useEffect(() => {
    if (selectedArtist) getSongsByArtist(selectedArtist.id).then(setSongs);
    else setSongs([]);
  }, [selectedArtist]);

  if (!user) return null;
  if (!isAdmin()) return <div className="jalafy-admin-root">Access denied</div>;

  // Función para abrir modal de edición
  function openEdit(type: any, data: any) {
    setEditType(type);
    setEditData(data);
    setModalOpen(true);
  }
  // Limpiar audioUrl al cerrar el modal
  function closeEdit() {
    setModalOpen(false);
    setEditData(null);
    setEditType(null);
  }

  // --- CRUD de Géneros ---
  const handleAddGenre = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = (e.target as any).name.value;
    const file = (e.target as any).image.files[0];
    const imageUrl = file ? await uploadImageToCloudinary(file) : '';
    await addGenre({ name, imageUrl });
    setGenres(await getGenres());
    (e.target as any).reset();
  };
  const handleDeleteGenre = async (id: string) => {
    await deleteGenre(id);
    setGenres(await getGenres());
    setSelectedGenre(null);
  };

  // Implementa handleSaveGenre para actualizar Firestore y cerrar el modal.
  const handleSaveGenre = async (updatedGenre: any) => {
    if (updatedGenre.id) {
      await updateGenre(updatedGenre.id, { name: updatedGenre.name, imageUrl: updatedGenre.imageUrl });
    } else {
      await addGenre({ name: updatedGenre.name, imageUrl: updatedGenre.imageUrl });
    }
    setGenres(await getGenres());
    setInfoMsg('Información guardada correctamente');
    closeEdit();
    setTimeout(() => setInfoMsg(null), 2000);
  };

  // --- CRUD de Artistas ---
  const handleAddArtist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGenre) return;
    const name = (e.target as any).name.value;
    const file = (e.target as any).image.files[0];
    const imageUrl = file ? await uploadImageToCloudinary(file) : '';
    await addArtist({ name, imageUrl, genreId: selectedGenre.id });
    setArtists(await getArtistsByGenre(selectedGenre.id));
    (e.target as any).reset();
  };
  const handleDeleteArtist = async (id: string) => {
    if (!selectedGenre) return;
    await deleteArtist(id);
    setArtists(await getArtistsByGenre(selectedGenre.id));
    setSelectedArtist(null);
  };

  // Implementa handleSaveArtist para actualizar Firestore y cerrar el modal.
  const handleSaveArtist = async (updatedArtist: any) => {
    if (updatedArtist.id) {
      await updateArtist(updatedArtist.id, {
        name: updatedArtist.name,
        imageUrl: updatedArtist.imageUrl,
        genreId: updatedArtist.genreId
      });
    } else {
      await addArtist({ name: updatedArtist.name, imageUrl: updatedArtist.imageUrl, genreId: updatedArtist.genreId });
    }
    setArtists(await getArtistsByGenre(selectedGenre!.id));
    setInfoMsg('Información guardada correctamente');
    closeEdit();
    setTimeout(() => setInfoMsg(null), 2000);
  };

  // --- CRUD de Canciones ---
  const handleAddSong = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedArtist) return;
    const name = (e.target as any).name.value;
    const file = (e.target as any).audio.files[0];
    const audioUrl = file ? await uploadAudioToCloudinary(file) : '';
    await addSong({ name, audioUrl, artistId: selectedArtist.id });
    setSongs(await getSongsByArtist(selectedArtist.id));
    (e.target as any).reset();
  };
  const handleDeleteSong = async (id: string) => {
    if (!selectedArtist) return;
    await deleteSong(id);
    setSongs(await getSongsByArtist(selectedArtist.id));
  };

  // Implementa handleSaveSong para actualizar Firestore y cerrar el modal.
  const handleSaveSong = async (updatedSong: any) => {
    if (updatedSong.id) {
      await updateSong(updatedSong.id, {
        name: updatedSong.name,
        imageUrl: updatedSong.imageUrl,
        audioUrl: updatedSong.audioUrl,
        artistId: updatedSong.artistId
      });
    } else {
      await addSong({ name: updatedSong.name, imageUrl: updatedSong.imageUrl, audioUrl: updatedSong.audioUrl, artistId: updatedSong.artistId });
    }
    // Espera a que la lista se actualice antes de cerrar el modal
    const refreshed = await getSongsByArtist(selectedArtist!.id);
    setSongs(refreshed);
    setInfoMsg('Información guardada correctamente');
    closeEdit();
    setTimeout(() => setInfoMsg(null), 2000);
  };

  // --- Formularios de edición ---
  function GenreEditForm({ genre, onSave }: { genre: any, onSave: any }) {
    const [name, setName] = useState(genre.name || "");
    const [imageUrl, setImageUrl] = useState(genre.imageUrl || "");
    const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files![0];
      if (file) setImageUrl(await uploadImageToCloudinary(file));
    };
    return (
      <form onSubmit={e => { e.preventDefault(); onSave({ ...genre, name, imageUrl }); }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
        <input type="file" accept="image/*" onChange={handleImage} />
        {imageUrl && <img src={imageUrl} alt="preview" width={100} />}
        <button type="submit">Guardar</button>
      </form>
    );
  }
  function ArtistEditForm({ artist, genres, onSave }: { artist: any, genres: any, onSave: any }) {
    const [name, setName] = useState(artist.name || "");
    const [imageUrl, setImageUrl] = useState(artist.imageUrl || "");
    const [genreId, setGenreId] = useState(artist.genreId || genres[0]?.id);
    const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files![0];
      if (file) setImageUrl(await uploadImageToCloudinary(file));
    };
    return (
      <form onSubmit={e => { e.preventDefault(); onSave({ ...artist, name, imageUrl, genreId }); }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
        <select value={genreId} onChange={e => setGenreId(e.target.value)}>
          {genres.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input type="file" accept="image/*" onChange={handleImage} />
        {imageUrl && <img src={imageUrl} alt="preview" width={100} />}
        <button type="submit">Guardar</button>
      </form>
    );
  }
  function SongEditForm({ song, artists, onSave }: { song: any, artists: any, onSave: any }) {
    const [name, setName] = useState(song.name || "");
    const [imageUrl, setImageUrl] = useState(song.imageUrl || "");
    const [audioUrl, setAudioUrl] = useState(song.audioUrl || "");
    const [artistId, setArtistId] = useState(song.artistId || artists[0]?.id);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);

    // Sincronizar audioUrl si cambia la canción editada
    useEffect(() => {
      setAudioUrl(song.audioUrl || "");
    }, [song.id]);

    const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files![0];
      if (file) setImageUrl(await uploadImageToCloudinary(file));
    };
    const handleAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files![0];
      if (file) {
        setUploadingAudio(true);
        setAudioError(null);
        try {
          const url = await uploadAudioToCloudinary(file);
          setAudioUrl(url);
        } catch (err: any) {
          setAudioError('Error al subir audio: ' + (err?.message || ''));
        } finally {
          setUploadingAudio(false);
        }
      }
    };
    return (
      <form onSubmit={e => { e.preventDefault(); onSave({ ...song, name, imageUrl, audioUrl: audioUrl || song.audioUrl, artistId }); }}>
        <div style={{display:'flex',alignItems:'flex-start',gap:24}}>
          <div style={{flex:1, display:'flex', flexDirection:'column', gap:0}}>
            <label style={{marginBottom: '18px'}}>Nombre de la canción:</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" style={{marginBottom: '24px', marginTop: '-10px'}} />
            <label style={{marginBottom: '2px'}}>Artista:</label>
            <select value={artistId} onChange={e => setArtistId(e.target.value)} style={{flex:1}}>
              {artists.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <label>Imagen:</label>
            <input type="file" accept="image/*" onChange={handleImage} />
            {imageUrl && <img src={imageUrl} alt="preview" width={100} style={{display:'block',marginTop:8}} />}
          </div>
          <div style={{flex:1}}>
            <label>Audio (mp3):</label>
            <input type="file" accept="audio/*" onChange={handleAudio} />
            {uploadingAudio && <div style={{color:'#1DB954',marginTop:8}}>Subiendo audio...</div>}
            {audioError && <div style={{color:'red',marginTop:8}}>{audioError}</div>}
            {(audioUrl || song.audioUrl) && !uploadingAudio && (
              <audio controls src={audioUrl || song.audioUrl} style={{width:100,display:'block',marginTop:8}} />
            )}
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:24}}>
          <button type="submit" disabled={uploadingAudio}>Guardar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="jalafy-admin-root">
      <h1 className="jalafy-title">Admin Panel</h1>
      <div className="jalafy-admin-tabs">
        <button className={tab==='genres' ? 'active' : ''} onClick={()=>setTab('genres')}>Genres</button>
        <button className={tab==='artists' ? 'active' : ''} onClick={()=>setTab('artists')} disabled={!selectedGenre}>Artists</button>
        <button className={tab==='songs' ? 'active' : ''} onClick={()=>setTab('songs')} disabled={!selectedArtist}>Songs</button>
      </div>
      {tab==='genres' && (
        <div className="jalafy-admin-section">
          <button
            style={{
              display: 'block',
              margin: '0 auto 20px auto',
              background: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              padding: '8px 20px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#1ed760')}
            onMouseOut={e => (e.currentTarget.style.background = '#1DB954')}
            onClick={()=>openEdit('genre', {name:'',imageUrl:''})}
          >
            + Add Genre
          </button>
          <div className="jalafy-admin-list">
            {genres.map((g: any) => (
              <div key={g.id} className={`jalafy-admin-item${selectedGenre?.id===g.id?' selected':''}`} onClick={()=>setSelectedGenre(g)}>
                {g.imageUrl && <img src={g.imageUrl} alt={g.name} />}
                <span>{g.name}</span>
                <div className="jalafy-admin-item-actions">
                  <button onClick={(e: any) => { e.stopPropagation(); openEdit('genre', g); }}><FaEdit /></button>
                  <button onClick={(e: any) => { e.stopPropagation(); handleDeleteGenre(g.id); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==='artists' && selectedGenre && (
        <div className="jalafy-admin-section">
          <button
            style={{
              display: 'block',
              margin: '0 auto 20px auto',
              background: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              padding: '8px 20px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#1ed760')}
            onMouseOut={e => (e.currentTarget.style.background = '#1DB954')}
            onClick={()=>openEdit('artist', {name:'',imageUrl:'',genreId:selectedGenre.id})}
          >
            + Add Artist
          </button>
          <div className="jalafy-admin-list">
            {artists.map((a: any) => (
              <div key={a.id} className={`jalafy-admin-item${selectedArtist?.id===a.id?' selected':''}`} onClick={()=>setSelectedArtist(a)}>
                {a.imageUrl && <img src={a.imageUrl} alt={a.name} />}
                <span>{a.name}</span>
                <div className="jalafy-admin-item-actions">
                  <button onClick={(e: any) => { e.stopPropagation(); openEdit('artist', a); }}><FaEdit /></button>
                  <button onClick={(e: any) => { e.stopPropagation(); handleDeleteArtist(a.id); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==='songs' && selectedArtist && (
        <div className="jalafy-admin-section">
          <button
            style={{
              display: 'block',
              margin: '0 auto 20px auto',
              background: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              padding: '8px 20px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#1ed760')}
            onMouseOut={e => (e.currentTarget.style.background = '#1DB954')}
            onClick={()=>openEdit('song', {name:'',imageUrl:'',audioUrl:'',artistId:selectedArtist.id})}
          >
            + Add Song
          </button>
          <div className="jalafy-admin-list">
            {songs.map((s: any) => {
              const hasAudio = !!s.audioUrl;
              return (
                <SongItem
                  key={s.id}
                  song={s}
                  onEdit={(song: any) => openEdit('song', song)}
                  onDelete={handleDeleteSong}
                />
              );
            })}
          </div>
        </div>
      )}
      <EditModal open={modalOpen} onClose={closeEdit}>
        {editType === 'genre' && <GenreEditForm genre={editData} onSave={handleSaveGenre} />}
        {editType === 'artist' && <ArtistEditForm artist={editData} genres={genres} onSave={handleSaveArtist} />}
        {editType === 'song' && <SongEditForm song={editData} artists={artists} onSave={handleSaveSong} />}
      </EditModal>
      {infoMsg && (
        <div style={{
          position: 'fixed',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30,30,30,0.95)',
          color: 'white',
          padding: '16px 32px',
          borderRadius: 24,
          fontSize: 18,
          fontWeight: 600,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          zIndex: 9999,
          transition: 'opacity 0.3s',
          textAlign: 'center',
        }}>
          {infoMsg}
        </div>
      )}
    </div>
  );
};

function SongItem({ song, onEdit, onDelete }: { song: any, onEdit: any, onDelete: any }) {
  const hasAudio = !!song.audioUrl;
  return (
    <div className="jalafy-admin-item">
      {song.imageUrl ? (
        <img src={song.imageUrl} alt={song.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginRight: 16, border: '2px solid #1DB954' }} />
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, fontSize: 24, color: '#1DB954', border: '2px solid #1DB954' }}>
          <span role="img" aria-label="disco">💿</span>
        </div>
      )}
      <span>
        {song.name}
        {hasAudio && <span style={{marginLeft:8, fontSize:18}} title="Esta canción tiene un mp3"><span role="img" aria-label="disco">💿</span></span>}
      </span>
      <audio
        controls
        src={hasAudio ? song.audioUrl : undefined}
        style={{
          width: '120px',
          marginLeft: 8,
          opacity: hasAudio ? 1 : 0.5,
          pointerEvents: hasAudio ? 'auto' : 'none',
          filter: hasAudio ? 'none' : 'grayscale(100%)',
        }}
      />
      <div className="jalafy-admin-item-actions">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(song); }}
        ><FaEdit /></button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(song.id); }}
        >Delete</button>
      </div>
    </div>
  );
}

export default AdminPanel; 