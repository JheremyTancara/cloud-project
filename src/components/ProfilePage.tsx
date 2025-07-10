import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ProfilePage.css';
import Header from './Header';
import { uploadImageToCloudinary } from '../utils/cloudinary';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/');
      } else {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Calcular edad al cambiar fecha de nacimiento
  useEffect(() => {
    if (profile.fecha_nacimiento) {
      const today = new Date();
      const birth = new Date(profile.fecha_nacimiento);
      let years = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        years--;
      }
      setProfile((prev: any) => ({ ...prev, edad: years.toString() }));
    }
    // eslint-disable-next-line
  }, [profile.fecha_nacimiento]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          nombre: profile.nombre,
          apellido: profile.apellido,
          fecha_nacimiento: profile.fecha_nacimiento,
          edad: profile.edad,
          direccion: profile.direccion,
        });
      }
    } catch (err) {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Imagen de perfil: subir
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    setImageError('');
    setImageSuccess('');
    let file: File | null = null;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else {
      file = e.target.files?.[0] || null;
    }
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Solo se permiten imágenes');
      return;
    }
    setImageUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setProfile((prev: any) => ({ ...prev, imageUrl: url }));
      setImageSuccess('Imagen subida correctamente');
      // Guardar en Firestore
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { imageUrl: url });
      }
    } catch (err) {
      setImageError('Error al subir la imagen');
    } finally {
      setImageUploading(false);
    }
  };

  // Imagen de perfil: borrar
  const handleDeleteImage = async () => {
    setImageError('');
    setImageSuccess('');
    setImageUploading(true);
    try {
      setProfile((prev: any) => ({ ...prev, imageUrl: '' }));
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { imageUrl: '' });
      }
      setImageSuccess('Imagen eliminada');
    } catch (err) {
      setImageError('Error al eliminar la imagen');
    } finally {
      setImageUploading(false);
    }
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleImageChange(e);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Mostrar mensajes temporales
  useEffect(() => {
    if (imageSuccess) {
      const t = setTimeout(() => setImageSuccess(''), 2500);
      return () => clearTimeout(t);
    }
  }, [imageSuccess]);
  useEffect(() => {
    if (imageError) {
      const t = setTimeout(() => setImageError(''), 2500);
      return () => clearTimeout(t);
    }
  }, [imageError]);

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',width:'100vw',background:'#f5f6fa'}}>
      <div className="loading-content">
        <div className="profile-spinner" />
        <span className="loading-text">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-form-container">
        <h2 className="profile-title">My Profile</h2>
        {/* Imagen de perfil */}
        <div
          className="profile-image-drop"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}
        >
          <div style={{ position: 'relative', marginBottom: 10 }}>
            {profile.imageUrl ? (
              <img
                src={profile.imageUrl}
                alt="profile"
                className="profile-avatar-img"
                style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1DB954', boxShadow: '0 2px 12px #0008' }}
              />
            ) : (
              <div style={{ width: 110, height: 110, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#1DB954', border: '3px solid #1DB954' }}>
                <span role="img" aria-label="user">👤</span>
              </div>
            )}
            {profile.imageUrl && (
              <button
                type="button"
                className="profile-image-delete-btn"
                onClick={handleDeleteImage}
                style={{ position: 'absolute', top: 0, right: 0, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontWeight: 700, fontSize: 18, boxShadow: '0 2px 8px #0006' }}
                title="Eliminar imagen"
                disabled={imageUploading}
              >
                ×
              </button>
            )}
          </div>
          <label htmlFor="profile-image-input" className="profile-image-upload-label" style={{ color: '#1DB954', cursor: 'pointer', fontWeight: 600, marginBottom: 6 }}>
            {imageUploading ? 'Subiendo imagen...' : 'Arrastra o haz click para subir/actualizar imagen'}
          </label>
          <input
            id="profile-image-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
            disabled={imageUploading}
          />
          {imageError && <div style={{ color: '#e74c3c', marginTop: 4 }}>{imageError}</div>}
          {imageSuccess && <div style={{ color: '#1DB954', marginTop: 4 }}>{imageSuccess}</div>}
        </div>
        {/* Formulario de perfil */}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">First Name(s)</label>
            <input 
              type="text" 
              name="nombre" 
              value={profile.nombre || ''} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name(s)</label>
            <input 
              type="text" 
              name="apellido" 
              value={profile.apellido || ''} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Birthdate</label>
            <input 
              type="date" 
              name="fecha_nacimiento" 
              value={profile.fecha_nacimiento || ''} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Age</label>
            <input 
              type="text" 
              name="edad" 
              value={profile.edad || ''} 
              readOnly 
              className="input-field readonly-field" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Address <span className="optional-text">(optional)</span>
            </label>
            <input 
              type="text" 
              name="direccion" 
              value={profile.direccion || ''} 
              onChange={handleChange} 
              className="input-field" 
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={saving} className="save-button">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={() => navigate('/home')} className="back-button">
            Back to Home
          </button>
        </form>
      </div>
    </div>
  );
}
 