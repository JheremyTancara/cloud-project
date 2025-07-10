import fetch from 'node-fetch';
import { addArtist, addSong } from '../firebaseConfig';

// Pega aquí tu token de acceso de Spotify
const token = 'TU_TOKEN_AQUI'; // <-- REEMPLAZA ESTO POR TU TOKEN

async function fetchWebApi(endpoint: string, method: string, body?: any) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  return await res.json();
}

async function getTopTracks() {
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=10', 'GET'
  )).items;
}

async function seedTopTracks() {
  const topTracks = await getTopTracks();
  for (const track of topTracks) {
    // Agrega el artista (puedes mejorar para evitar duplicados)
    const artistObj = {
      name: track.artists[0].name,
      imageUrl: track.album.images[0]?.url || '', // Usa la portada del álbum como imagen del artista
      genreId: '',  // Puedes dejarlo vacío o asignar un género genérico
    };
    const artistRef = await addArtist(artistObj);

    // Agrega la canción (sin audioUrl, lo subes después)
    const songObj = {
      name: track.name,
      artistId: artistRef.id || artistRef.path?.segments?.pop(),
      audioUrl: '',
    };
    await addSong(songObj);
    console.log(`Agregado: ${track.name} - ${artistObj.name}`);
  }
  console.log('¡Canciones y artistas agregados a Firestore!');
}

seedTopTracks(); 