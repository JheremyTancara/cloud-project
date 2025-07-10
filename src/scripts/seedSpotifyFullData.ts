import fetch from 'node-fetch';
import { addGenre, addArtist, addSong } from '../firebaseConfig';

// Token de acceso de Spotify proporcionado por el usuario
const token = 'BQCKizZhLa8_RMtzHq8ReDy_PMZlw6-xFk8AGGFAzrSIMjk3VP9eg6kvsLeNEl2_WITa0CvI-3x-LPlZGmUkkJmw3VbJ5OsRMy3O4Hgd7Evto0gbrd3soxaVDfswjCSTE3H1-8DA88fsHpO-ca-4mVplxOXM4h2dZE-EHvTxqAUY2XxJa06fgfviZGXa8cHw1zJ8aA3-kLNs3pOi6CGAsf2Yz5zMHVdSRxeAGXuKrxz2yH6cmAb9pGHXBqFV-LrEKrQz2aYhd46rKKebrx-bGe4zc7-PN9Z4Pt6N8NXBmqR-X-grJOnVOZMbcqQ0n99i';

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

// 1. Obtener géneros populares de Spotify
async function getGenres() {
  const data = await fetchWebApi('v1/recommendations/available-genre-seeds', 'GET');
  return data.genres.slice(0, 5); // Limita a 5 géneros para demo
}

// 2. Obtener artistas populares para un género
async function getArtistsByGenre(genre: string) {
  const data = await fetchWebApi(`v1/search?q=genre:%22${genre}%22&type=artist&limit=3`, 'GET');
  return data.artists.items;
}

// 3. Obtener canciones populares para un artista
async function getSongsByArtist(artistId: string) {
  const data = await fetchWebApi(`v1/artists/${artistId}/top-tracks?market=US`, 'GET');
  return data.tracks.slice(0, 3); // Limita a 3 canciones por artista
}

async function seedSpotifyFullData() {
  const genres = await getGenres();
  for (const genre of genres) {
    const genreObj = { name: genre, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/genre-placeholder.png' };
    const genreRef = await addGenre(genreObj);
    const genreId = genreRef.id || genreRef.path?.segments?.pop();
    const artists = await getArtistsByGenre(genre);
    for (const artist of artists) {
      const artistObj = {
        name: artist.name,
        imageUrl: artist.images[0]?.url || 'https://res.cloudinary.com/demo/image/upload/v1690000000/artist-placeholder.png',
        genreId: genreId
      };
      const artistRef = await addArtist(artistObj);
      const artistId = artistRef.id || artistRef.path?.segments?.pop();
      const songs = await getSongsByArtist(artist.id);
      for (const song of songs) {
        const songObj = {
          name: song.name,
          artistId: artistId,
          audioUrl: '', // Lo subirás tú después
        };
        await addSong(songObj);
        console.log(`Agregado: ${song.name} - ${artist.name} (${genre})`);
      }
    }
  }
  console.log('¡Base de datos poblada con géneros, artistas y canciones de Spotify!');
}

seedSpotifyFullData(); 