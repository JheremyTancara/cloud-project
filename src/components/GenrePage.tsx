import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArtistsByGenre, getGenres } from '../firebaseConfig';
import type { Artist, Genre } from '../types/music';
import '../styles/GenrePage.css';

const GenrePage: React.FC = () => {
  const { genreId } = useParams<{ genreId: string }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genre, setGenre] = useState<Genre | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (genreId) {
      getArtistsByGenre(genreId).then(setArtists);
      getGenres().then(genres => setGenre(genres.find(g => g.id === genreId) || null));
    }
  }, [genreId]);

  if (!genre) return <div className="jalafy-genre-root">Loading...</div>;

  return (
    <div className="jalafy-genre-root">
      <h1 className="jalafy-title">{genre.name}</h1>
      <div className="jalafy-artists-list">
        {artists.map((artist) => (
          <div
            key={artist.id}
            className="jalafy-artist-card"
            onClick={() => navigate(`/artist/${artist.id}`)}
          >
            {artist.imageUrl && (
              <img src={artist.imageUrl} alt={artist.name} className="jalafy-artist-img" />
            )}
            <div className="jalafy-artist-name">{artist.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenrePage; 