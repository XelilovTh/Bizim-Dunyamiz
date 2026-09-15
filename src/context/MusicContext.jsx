import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useData } from './DataContext';
import { trackUserAction } from '../services/analyticsService';

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const { musicList } = useData();

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

  const audioRef = useRef(new Audio());
  const currentTrackRef = useRef(currentTrack);
  const musicListRef = useRef(musicList);
  const isShuffleRef = useRef(isShuffle);
  const isRepeatRef = useRef(isRepeat);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    musicListRef.current = musicList;
    if (currentTrack) {
      const updated = musicList.find((m) => m.id === currentTrack.id);
      if (updated && (updated.isFavorite !== currentTrack.isFavorite || updated.title !== currentTrack.title)) {
        setCurrentTrack(updated);
      }
    }
  }, [musicList, currentTrack]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.preload = 'metadata'; // Trafikə qənaət: bütün faylı qabaqcadan yükləmə

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (isRepeatRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNextTrack();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Mobil Telefonun Kilid Ekranı və Bildiriş Paneli İdarəetməsi (MediaSession API)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      if (currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || 'Adsız Mahnı',
          artist: currentTrack.artist || 'Fidan & Təhmaz',
          album: 'Bizim Dünyamız',
          artwork: [
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        });

        try {
          navigator.mediaSession.setActionHandler('play', () => {
            audioRef.current.play().catch(() => {});
          });
          navigator.mediaSession.setActionHandler('pause', () => {
            audioRef.current.pause();
          });
          navigator.mediaSession.setActionHandler('previoustrack', () => {
            handlePrevTrack();
          });
          navigator.mediaSession.setActionHandler('nexttrack', () => {
            handleNextTrack();
          });
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) {
              audioRef.current.currentTime = details.seekTime;
            }
          });
        } catch (e) {}
      }
    }
  }, [currentTrack, isPlaying]);

  // Mahnını oxut / dayandır
  const playTrack = (track) => {
    if (!track) return;
    const audio = audioRef.current;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
      return;
    }

    setCurrentTrack(track);
    audio.src = track.url;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.warn('Audio play auto-block və ya url xətası:', err);
    });

    trackUserAction('Musiqi Dinlənilir', `«${track.title}» - ${track.artist}`);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!currentTrack && musicList.length > 0) {
      playTrack(musicList[0]);
      return;
    }
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const seekTo = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const handleNextTrack = () => {
    const list = musicListRef.current;
    if (!list || list.length === 0) return;
    const current = currentTrackRef.current;
    const currentIndex = list.findIndex((m) => m.id === current?.id);

    let nextIndex;
    if (isShuffleRef.current) {
      nextIndex = Math.floor(Math.random() * list.length);
    } else {
      nextIndex = (currentIndex + 1) % list.length;
    }

    playTrack(list[nextIndex]);
  };

  const handlePrevTrack = () => {
    const list = musicListRef.current;
    if (!list || list.length === 0) return;
    const audio = audioRef.current;

    // Əgər 3 saniyədən çox çalınıbsa, əvvələ qaytar
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const current = currentTrackRef.current;
    const currentIndex = list.findIndex((m) => m.id === current?.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    playTrack(list[prevIndex]);
  };

  const toggleShuffle = () => setIsShuffle((prev) => !prev);
  const toggleRepeat = () => setIsRepeat((prev) => !prev);

  const openFullPlayer = () => setIsFullPlayerOpen(true);
  const closeFullPlayer = () => setIsFullPlayerOpen(false);

  const closeMiniPlayer = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTrack(null);
    setIsPlaying(false);
    setIsFullPlayerOpen(false);
  };

  // Dəqiqə:Saniyə formatlayıcı
  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        isShuffle,
        isRepeat,
        isFullPlayerOpen,
        playTrack,
        togglePlay,
        seekTo,
        nextTrack: handleNextTrack,
        prevTrack: handlePrevTrack,
        toggleShuffle,
        toggleRepeat,
        openFullPlayer,
        closeFullPlayer,
        closeMiniPlayer,
        formatTime,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}

