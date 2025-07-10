import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import type { Genre, Artist, Song } from './types/music';

const firebaseConfig = {
  apiKey: 'AIzaSyCLSJ_naNXokkw-2F1tO_PXFGjsiRvG80c',
  authDomain: 'cloud-develpme.firebaseapp.com',
  projectId: 'cloud-develpme',
  storageBucket: 'cloud-develpme.firebasestorage.app',
  messagingSenderId: '1018788418248',
  appId: '1:1018788418248:web:e00adcf50e66c289da4bfd',
  measurementId: 'G-BDF367K48C'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Genres ---
export const genresCollection = collection(db, 'genres');
export async function getGenres(): Promise<Genre[]> {
  const snap = await getDocs(genresCollection);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Genre));
}
export async function addGenre(genre: Omit<Genre, 'id'>) {
  return await addDoc(genresCollection, genre);
}
export async function updateGenre(id: string, data: Partial<Genre>) {
  return await updateDoc(doc(db, 'genres', id), data);
}
export async function deleteGenre(id: string) {
  return await deleteDoc(doc(db, 'genres', id));
}

// --- Artists ---
export const artistsCollection = collection(db, 'artists');
export async function getArtistsByGenre(genreId: string): Promise<Artist[]> {
  const snap = await getDocs(artistsCollection);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist)).filter(a => a.genreId === genreId);
}
export async function addArtist(artist: Omit<Artist, 'id'>) {
  return await addDoc(artistsCollection, artist);
}
export async function updateArtist(id: string, data: Partial<Artist>) {
  return await updateDoc(doc(db, 'artists', id), data);
}
export async function deleteArtist(id: string) {
  return await deleteDoc(doc(db, 'artists', id));
}

export async function getArtistById(artistId: string): Promise<Artist | null> {
  const ref = doc(db, 'artists', artistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Artist;
}

// --- Songs ---
export const songsCollection = collection(db, 'songs');
export async function getSongsByArtist(artistId: string): Promise<Song[]> {
  const snap = await getDocs(songsCollection);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)).filter(s => s.artistId === artistId);
}
export async function addSong(song: Omit<Song, 'id'>) {
  return await addDoc(songsCollection, song);
}
export async function updateSong(id: string, data: Partial<Song>) {
  return await updateDoc(doc(db, 'songs', id), data);
}
export async function deleteSong(id: string) {
  return await deleteDoc(doc(db, 'songs', id));
}

export async function getTopSongs(limitCount: number = 5): Promise<Song[]> {
  const q = query(songsCollection, orderBy('playCount', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
}

// Mantener solo la exportación de db y lo necesario para usuarios 