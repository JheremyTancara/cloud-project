import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGenres } from '../firebaseConfig';
import type { Genre } from '../types/music';
import '../styles/HomePage.css';
import Header from './Header';

const HomePage: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);

  return (
    <div className="jalafy-home-root">
      <Header />
      <h1 className="jalafy-title">Jalafy</h1>
      <h2 className="jalafy-subtitle">Discover by Genre</h2>
      <div className="jalafy-genres-list">
        {genres.map((genre) => (
          <div
            key={genre.id}
            className="jalafy-genre-card"
            onClick={() => navigate(`/genre/${genre.id}`)}
          >
            {genre.imageUrl && (
              <img src={genre.imageUrl} alt={genre.name} className="jalafy-genre-img" />
            )}
            <div className="jalafy-genre-name">{genre.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage; 