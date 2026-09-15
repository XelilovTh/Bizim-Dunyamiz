import React from 'react';
import { Music, Play, Pause, Heart, Check } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import './MusicItem.css';

export default function MusicItem({
  song,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onToggleFavorite,
}) {
  const { currentTrack, isPlaying, playTrack } = useMusic();

  const isCurrent = currentTrack?.id === song.id;
  const isCurrentPlaying = isCurrent && isPlaying;

  const handleRowClick = () => {
    if (isSelectMode) {
      onToggleSelect(song.id);
    } else {
      playTrack(song);
    }
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    playTrack(song);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(song.id);
  };

  return (
    <div
      className={`music-track-row ${isCurrent ? 'current-track' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleRowClick}
    >
      {/* Sol ikon / Playing animasiyası */}
      <div className="track-icon-box">
        {isCurrentPlaying ? (
          <div className="playing-equalizer">
            <span className="eq-bar bar-1" />
            <span className="eq-bar bar-2" />
            <span className="eq-bar bar-3" />
          </div>
        ) : (
          <Music size={20} className="track-music-icon" strokeWidth={1.8} />
        )}
      </div>

      {/* Mahnı Məlumatları */}
      <div className="track-info">
        <h4 className="track-title">{song.title}</h4>
        <p className="track-artist">{song.artist}</p>
      </div>

      {/* Sağ Əməliyyatlar: Favori, Play/Pause və ya Checkbox */}
      <div className="track-actions">
        {isSelectMode ? (
          <div className={`music-select-checkbox ${isSelected ? 'checked' : ''}`}>
            {isSelected && <Check size={14} strokeWidth={3} />}
          </div>
        ) : (
          <>
            <button
              className={`track-favorite-btn ${song.isFavorite ? 'favorited' : ''}`}
              onClick={handleFavoriteClick}
              title={song.isFavorite ? 'Favorilərdən çıxar' : 'Favorilərə əlavə et'}
            >
              <Heart size={18} className="track-heart-icon" />
            </button>

            <button
              className="track-play-btn"
              onClick={handlePlayClick}
              aria-label={isCurrentPlaying ? 'Dayandır' : 'Oxut'}
            >
              {isCurrentPlaying ? (
                <Pause size={17} className="track-btn-icon" />
              ) : (
                <Play size={17} className="track-btn-icon play-icon" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

