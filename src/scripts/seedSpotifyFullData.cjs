const admin = require("firebase-admin");
const path = require("path");

// Pega aquí tu token de Spotify
const SPOTIFY_TOKEN = 'BQCKizZhLa8_RMtzHq8ReDy_PMZlw6-xFk8AGGFAzrSIMjk3VP9eg6kvsLeNEl2_WITa0CvI-3x-LPlZGmUkkJmw3VbJ5OsRMy3O4Hgd7Evto0gbrd3soxaVDfswjCSTE3H1-8DA88fsHpO-ca-4mVplxOXM4h2dZE-EHvTxqAUY2XxJa06fgfviZGXa8cHw1zJ8aA3-kLNs3pOi6CGAsf2Yz5zMHVdSRxeAGXuKrxz2yH6cmAb9pGHXBqFV-LrEKrQz2aYhd46rKKebrx-bGe4zc7-PN9Z4Pt6N8NXBmqR-X-grJOnVOZMbcqQ0n99i';

const serviceAccount = require(path.resolve(__dirname, "../../serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// Utilidad para llamar a la API de Spotify
async function fetchSpotify(endpoint) {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    headers: { Authorization: `Bearer ${SPOTIFY_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.statusText}`);
  return res.json();
}

// Lista de géneros populares (puedes agregar más si quieres)
const GENRES = [
  "pop", "rock", "hip hop", "latin", "reggaeton", "jazz", "classical", "electronic", "indie", "metal"
];

// Elimina todas las colecciones antes de poblar
async function clearCollection(collectionName) {
  const snap = await db.collection(collectionName).get();
  const batchSize = 500;
  let deleted = 0;
  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.slice(0, batchSize).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.docs.slice(0, batchSize).length;
    if (snap.docs.length <= batchSize) break;
  }
  console.log(`\x1b[33mColección '${collectionName}' eliminada (${deleted} documentos)\x1b[0m`);
}

async function seed() {
  try {
    // 0. Limpiar colecciones
    await clearCollection("genres");
    await clearCollection("artists");
    await clearCollection("songs");
    console.log("\x1b[32m--- Colecciones eliminadas. Comenzando poblamiento... ---\x1b[0m");
    // 1. Poblar géneros
    for (let i = 0; i < GENRES.length; i++) {
      const genre = GENRES[i];
      console.log(`\n\x1b[36m[${i + 1}/${GENRES.length}] Procesando género: ${genre}\x1b[0m`);
      await db.collection("genres").doc(genre).set({ id: genre, name: genre, imageUrl: "" });
      // Buscar artistas por género usando el endpoint de búsqueda
      let search;
      try {
        search = await fetchSpotify(`search?q=genre:%22${encodeURIComponent(genre)}%22&type=artist&limit=30`);
      } catch (e) {
        console.error(`  Error buscando artistas para género '${genre}':`, e.message);
        continue;
      }
      const artists = (search.artists?.items || []).slice(0, 7);
      console.log(`  Artistas encontrados: ${artists.length}`);

      for (let j = 0; j < artists.length; j++) {
        const artist = artists[j];
        console.log(`    [${j + 1}/5] Artista: ${artist.name}`);
        try {
          await db.collection("artists").doc(artist.id).set({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.images[0]?.url || "",
            genreId: genre,
          });
        } catch (e) {
          console.error(`      Error guardando artista '${artist.name}':`, e.message);
          continue;
        }

        // 3. Para cada artista, obtener 5 canciones (top tracks)
        let topTracks = [];
        try {
          const tracksData = await fetchSpotify(`artists/${artist.id}/top-tracks?market=US`);
          topTracks = (tracksData.tracks || []).slice(0, 5);
        } catch (e) {
          console.error(`      Error obteniendo top tracks de '${artist.name}':`, e.message);
          continue;
        }

        for (let k = 0; k < topTracks.length; k++) {
          const track = topTracks[k];
          try {
            await db.collection("songs").doc(track.id).set({
              id: track.id,
              name: track.name,
              artistId: artist.id,
              audioUrl: track.preview_url || "",
              imageUrl: track.album?.images?.[0]?.url || ""
            });
            console.log(`        [${k + 1}/5] Canción: ${track.name}`);
          } catch (e) {
            console.error(`        Error guardando canción '${track.name}':`, e.message);
          }
        }
      }
    }

    console.log("\n¡Base de datos poblada con géneros, 5 artistas por género y 5 canciones por artista!");
    process.exit(0);
  } catch (err) {
    console.error("Error al poblar Firestore:", err);
    process.exit(1);
  }
}

seed(); 