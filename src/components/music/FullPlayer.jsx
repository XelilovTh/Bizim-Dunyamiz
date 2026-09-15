import React, { useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { useData } from '../../context/DataContext';
import './FullPlayer.css';

export default function FullPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isShuffle,
    isRepeat,
    isFullPlayerOpen,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    closeFullPlayer,
    formatTime,
  } = useMusic();

  const { musicList, setMusicList } = useData();

  const touchStartYRef = useRef(0);
  const touchEndYRef = useRef(0);

  if (!isFullPlayerOpen || !currentTrack) return null;

  // Favorit statusunu dəyişmək
  const handleToggleFavorite = () => {
    setMusicList((prev) =>
      prev.map((m) => (m.id === currentTrack.id ? { ...m, isFavorite: !m.isFavorite } : m))
    );
  };

  // Swipe Down ilə bağlamaq
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartYRef.current || !touchEndYRef.current) return;
    const diff = touchEndYRef.current - touchStartYRef.current;
    // 60px aşağı çəkildikdə bağla
    if (diff > 60) {
      closeFullPlayer();
    }
    touchStartYRef.current = 0;
    touchEndYRef.current = 0;
  };

  const currentSongInList = musicList.find((m) => m.id === currentTrack.id);
  const isFavorite = Boolean(currentSongInList ? currentSongInList.isFavorite : currentTrack.isFavorite);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  return (
    <div
      className="full-player-overlay"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="full-player-glass-card">
        {/* Üst Header: Aşağı ox, Loqo və Favori */}
        <div className="full-player-header">
          <button
            className="full-player-icon-btn"
            onClick={closeFullPlayer}
            title="Aşağı sürüşdür"
          >
            <ChevronDown size={28} />
          </button>

          <span className="full-player-logo-script">Bizim Dünyamız</span>

          <button
            className={`full-player-icon-btn ${isFavorite ? 'favorited' : ''}`}
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Favorilərdən çıxar' : 'Favorilərə əlavə et'}
          >
            <Heart
              size={22}
              className="header-heart"
              fill={isFavorite ? '#ff1a5e' : 'none'}
              color={isFavorite ? '#ff1a5e' : 'rgba(255, 255, 255, 0.75)'}
            />
          </button>
        </div>

        {/* Mərkəz: Vinil Disk və Canlı Arxa İşıq */}
        <div className="vinyl-section">
          {/* Canlı Parıltı Aurası */}
          <div className={`ambient-vinyl-glow ${isPlaying ? 'active' : ''}`} />

          <div className="vinyl-wrapper">
            {/* Fırlanan Vinil Disk */}
            <div className={`vinyl-disc ${isPlaying ? 'spinning' : 'paused'}`}>
              {/* Vinil Üzərində İşıq Əks Olunması (Sheen) */}
              <div className="vinyl-sheen" />

              {/* Vinil Cığırları */}
              <div className="vinyl-groove groove-outer" />
              <div className="vinyl-groove groove-1" />
              <div className="vinyl-groove groove-2" />
              <div className="vinyl-groove groove-3" />
              <div className="vinyl-groove groove-inner" />

              {/* Mərkəzi Etiket */}
              <div className="vinyl-center-label">
                <div className="vinyl-label-rim" />
                <Heart size={26} className="vinyl-center-heart" />
                <div className="vinyl-spindle-hole" />
              </div>
            </div>

            {/* Vinil Qolcuğu (Tonearm) */}
            <div className={`vinyl-tonearm ${isPlaying ? 'active' : ''}`}>
              <div className="tonearm-base">
                <div className="tonearm-base-core" />
              </div>
              <div className="tonearm-rod">
                <div className="tonearm-head" />
                <div className="tonearm-cartridge">
                  <div className="tonearm-needle-glow" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mahnı Adı və İfaçı */}
        <div className="full-player-track-info">
          <div className="track-title-row">
            <h2 className="full-track-title">{currentTrack.title}</h2>
          </div>
          <p className="full-track-artist">{currentTrack.artist}</p>
        </div>

        {/* Scrub Bar / İrəliləyiş Zolağı */}
        <div className="full-player-progress-area">
          <div className="progress-slider-wrapper">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSliderChange}
              className="scrub-slider"
              style={{
                background: `linear-gradient(to right, #ff1a5e ${progressPercent}%, rgba(255, 255, 255, 0.15) ${progressPercent}%)`,
              }}
            />
          </div>

          <div className="progress-time-row">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* İdarəetmə Düymələri (Shuffle, Prev, Play/Pause, Next, Repeat) */}
        <div className="full-player-controls-row">
          {/* Qarışdır (Shuffle) */}
          <button
            className={`control-btn-subtle ${isShuffle ? 'active-pink' : ''}`}
            onClick={toggleShuffle}
            title="Qarışdır"
          >
            <Shuffle size={20} />
            {isShuffle && <span className="ctrl-active-dot" />}
          </button>

          {/* Əvvəlki */}
          <button
            className="control-btn-nav"
            onClick={prevTrack}
            aria-label="Əvvəlki"
          >
            <SkipBack size={24} />
          </button>

          {/* Əsas Play / Pause */}
          <button
            className={`control-btn-play-main ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Dayandır' : 'Oxut'}
          >
            {isPlaying ? (
              <Pause size={32} />
            ) : (
              <Play size={32} className="main-play-icon" />
            )}
          </button>

          {/* Növbəti */}
          <button
            className="control-btn-nav"
            onClick={nextTrack}
            aria-label="Növbəti"
          >
            <SkipForward size={24} />
          </button>

          {/* Təkrarla (Repeat) */}
          <button
            className={`control-btn-subtle ${isRepeat ? 'active-pink' : ''}`}
            onClick={toggleRepeat}
            title="Təkrarla"
          >
            <Repeat size={20} />
            {isRepeat && <span className="ctrl-active-dot" />}
          </button>
        </div>
      </div>
    </div>
  );
}

