import React from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Disc } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import './MiniPlayer.css';

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    openFullPlayer,
    closeMiniPlayer,
  } = useMusic();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mini-player-wrapper">
      <div className="mini-player-glass" onClick={openFullPlayer}>
        {/* Sol tərəf: Mini fırlanan vinil ikonu */}
        <div className={`mini-player-disc ${isPlaying ? 'spinning' : ''}`}>
          <Disc size={34} className="mini-disc-icon" />
          <span className="mini-disc-center" />
        </div>

        {/* Mərkəz: Mahnı adı və İfaçı */}
        <div className="mini-player-info">
          <p className="mini-player-title">{currentTrack.title}</p>
          <p className="mini-player-artist">{currentTrack.artist}</p>
        </div>

        {/* Sağ: İdarəetmə düymələri */}
        <div
          className="mini-player-controls"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Əvvəlki */}
          <button
            className="mini-ctrl-btn"
            onClick={prevTrack}
            aria-label="Əvvəlki mahnı"
          >
            <SkipBack size={17} />
          </button>

          {/* Play/Pause */}
          <button
            className="mini-play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Dayandır' : 'Oxut'}
          >
            {isPlaying ? (
              <Pause size={17} />
            ) : (
              <Play size={17} className="play-icon-offset" />
            )}
          </button>

          {/* Növbəti */}
          <button
            className="mini-ctrl-btn"
            onClick={nextTrack}
            aria-label="Növbəti mahnı"
          >
            <SkipForward size={17} />
          </button>

          {/* Bağla */}
          <button
            className="mini-close-btn"
            onClick={closeMiniPlayer}
            aria-label="Pleyeri bağla"
          >
            <X size={16} />
          </button>
        </div>

        {/* İncə Proqres Zolağı */}
        <div className="mini-progress-track">
          <div
            className="mini-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

