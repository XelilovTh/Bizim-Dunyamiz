import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  fetchPhotosFromGitHub,
  savePhotosToGitHub,
  fetchMusicFromGitHub,
  saveMusicToGitHub,
  fetchLettersFromGitHub,
  saveLetterToGitHub,
  updateLetterToGitHub,
  deleteLetterFromGitHub,
} from '../services/githubService';
import { deletePhotoAPI, deleteBulkPhotosAPI } from '../services/photoService';
import { deleteMusicAPI, deleteBulkMusicAPI } from '../services/musicService';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // SWR Keşdən ilkin məlumatları dərhal oxu (0ms yüklənmə)
  const [photos, setPhotosState] = useState(() => {
    try {
      const c = localStorage.getItem('dunyam_cache_photos');
      return c ? JSON.parse(c) : [];
    } catch (e) {
      return [];
    }
  });

  const [letters, setLettersState] = useState(() => {
    try {
      const c = localStorage.getItem('dunyam_cache_letters');
      return c ? JSON.parse(c) : [];
    } catch (e) {
      return [];
    }
  });

  const [musicList, setMusicListState] = useState(() => {
    try {
      const c = localStorage.getItem('dunyam_cache_music');
      return c ? JSON.parse(c) : [];
    } catch (e) {
      return [];
    }
  });

  // Əgər keşdə heç olmasa bir şey varsa, ilkin yükləyici göstərmə (0ms açılış)
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem('dunyam_cache_photos') && !localStorage.getItem('dunyam_cache_music');
  });

  const setPhotos = (updater) => {
    setPhotosState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('dunyam_cache_photos', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const setLetters = (updater) => {
    setLettersState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('dunyam_cache_letters', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const setMusicList = (updater) => {
    setMusicListState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('dunyam_cache_music', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const photosShaRef = useRef(null);
  const musicShaRef = useRef(null);

  // 1. Tətbiq açılanda GitHub-dan arxa planda ən son məlumatları çək (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;

    async function loadAllData() {
      try {
        const [photosRes, musicRes, loadedLetters] = await Promise.all([
          fetchPhotosFromGitHub().catch(() => ({ photos: [], sha: null })),
          fetchMusicFromGitHub().catch(() => ({ musicList: [], sha: null })),
          fetchLettersFromGitHub().catch(() => []),
        ]);

        if (!isMounted) return;

        if (photosRes?.photos) {
          setPhotos(photosRes.photos);
          photosShaRef.current = photosRes.sha;
        }

        if (musicRes?.musicList) {
          setMusicList(musicRes.musicList);
          musicShaRef.current = musicRes.sha;
        }

        if (Array.isArray(loadedLetters)) {
          setLetters(loadedLetters);
        }
      } catch (err) {
        console.error('[DataContext] GitHub-dan məlumat yüklənərkən xəta:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ==========================================================================
     ŞƏKİLLƏR ÜZRƏ ƏMƏLİYYATLAR
     ========================================================================== */
  const addPhotos = async (newPhotosList) => {
    const updated = [...newPhotosList, ...photos];
    setPhotos(updated);

    const saveRes = await savePhotosToGitHub(updated, photosShaRef.current);
    if (saveRes?.sha) {
      photosShaRef.current = saveRes.sha;
    }
  };

  const removePhoto = async (photoToDelete) => {
    const updated = photos.filter((p) => p.id !== photoToDelete.id);
    setPhotos(updated);

    await deletePhotoAPI(photoToDelete);
    const saveRes = await savePhotosToGitHub(updated, photosShaRef.current);
    if (saveRes?.sha) {
      photosShaRef.current = saveRes.sha;
    }
  };

  const removeBulkPhotos = async (photosToDelete) => {
    const idsToDelete = photosToDelete.map((p) => p.id);
    const updated = photos.filter((p) => !idsToDelete.includes(p.id));
    setPhotos(updated);

    await deleteBulkPhotosAPI(photosToDelete);
    const saveRes = await savePhotosToGitHub(updated, photosShaRef.current);
    if (saveRes?.sha) {
      photosShaRef.current = saveRes.sha;
    }
  };

  /* ==========================================================================
     MƏKTUBLAR ÜZRƏ ƏMƏLİYYATLAR
     ========================================================================== */
  const addLetter = async (newLetter) => {
    // İlkin olaraq yerli siyahıya əlavə et
    const tempLetter = {
      ...newLetter,
      id: String(Date.now()),
      date: newLetter.date || new Date().toISOString(),
    };
    setLetters((prev) => [tempLetter, ...prev]);

    // GitHub-a yaz
    const res = await saveLetterToGitHub(tempLetter);
    if (res?.sha) {
      setLetters((prev) =>
        prev.map((l) =>
          l.id === tempLetter.id
            ? { ...l, id: res.sha, path: res.path, sha: res.sha }
            : l
        )
      );
    }
  };

  const removeLetter = async (letterToDelete) => {
    setLetters((prev) => prev.filter((l) => l.id !== letterToDelete.id));
    await deleteLetterFromGitHub(letterToDelete);
  };

  const removeBulkLetters = async (lettersToDelete) => {
    const idsToDelete = lettersToDelete.map((l) => l.id);
    setLetters((prev) => prev.filter((l) => !idsToDelete.includes(l.id)));
    await Promise.all(lettersToDelete.map((l) => deleteLetterFromGitHub(l)));
  };

  const updateLetter = async (updatedLetter) => {
    setLetters((prev) =>
      prev.map((l) => (l.id === updatedLetter.id ? updatedLetter : l))
    );
    const res = await updateLetterToGitHub(updatedLetter);
    if (res?.sha) {
      setLetters((prev) =>
        prev.map((l) =>
          l.id === updatedLetter.id ? { ...l, sha: res.sha } : l
        )
      );
    }
  };

  /* ==========================================================================
     MUSİQİLƏR ÜZRƏ ƏMƏLİYYATLAR
     ========================================================================== */
  const addMusic = async (newMusicList) => {
    const updated = [...newMusicList, ...musicList];
    setMusicList(updated);

    const saveRes = await saveMusicToGitHub(updated, musicShaRef.current);
    if (saveRes?.sha) {
      musicShaRef.current = saveRes.sha;
    }
  };

  const removeMusic = async (songToDelete) => {
    const updated = musicList.filter((m) => m.id !== songToDelete.id);
    setMusicList(updated);

    await deleteMusicAPI(songToDelete);
    const saveRes = await saveMusicToGitHub(updated, musicShaRef.current);
    if (saveRes?.sha) {
      musicShaRef.current = saveRes.sha;
    }
  };

  const removeBulkMusic = async (songsToDelete) => {
    const idsToDelete = songsToDelete.map((s) => s.id);
    const updated = musicList.filter((m) => !idsToDelete.includes(m.id));
    setMusicList(updated);

    await deleteBulkMusicAPI(songsToDelete);
    const saveRes = await saveMusicToGitHub(updated, musicShaRef.current);
    if (saveRes?.sha) {
      musicShaRef.current = saveRes.sha;
    }
  };

  const stats = {
    photosCount: photos.length,
    lettersCount: letters.length,
    musicCount: musicList.length,
  };

  return (
    <DataContext.Provider
      value={{
        photos,
        setPhotos,
        addPhotos,
        removePhoto,
        removeBulkPhotos,
        letters,
        setLetters,
        addLetter,
        updateLetter,
        removeLetter,
        removeBulkLetters,
        musicList,
        setMusicList,
        addMusic,
        removeMusic,
        removeBulkMusic,
        stats,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
