import React, { useState, useRef } from 'react';
import { Music, Upload, Trash2, CheckCircle, Play, Pause } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

import { uploadAudioToCloudinary } from '../../services/cloudinaryService';

export default function MusicUploadTab({ onSuccess }) {
  const { musicList, addMusic } = useData();
  const { showToast } = useToast();

  const [pendingMusic, setPendingMusic] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const fileInputRef = useRef(null);
  const audioPreviewRef = useRef(new Audio());

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newEntries = files.map((file, idx) => {
      const objectUrl = URL.createObjectURL(file);
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
      let defaultArtist = 'Bilinməyən İfaçı';
      let defaultTitle = cleanFileName;

      if (cleanFileName.includes('-')) {
        const parts = cleanFileName.split('-');
        defaultArtist = parts[0].trim();
        defaultTitle = parts.slice(1).join('-').trim();
      }

      const tempId = `${Date.now()}-${idx}-${Math.random()}`;

      // Calculate duration
      const audioTemp = new Audio(objectUrl);
      audioTemp.onloadedmetadata = () => {
        const sec = audioTemp.duration;
        if (sec && !isNaN(sec)) {
          const m = Math.floor(sec / 60);
          const s = Math.floor(sec % 60);
          setPendingMusic((prev) =>
            prev.map((item) =>
              item.tempId === tempId
                ? { ...item, duration: `${m}:${s < 10 ? '0' : ''}${s}` }
                : item
            )
          );
        }
      };

      return {
        tempId,
        file,
        title: defaultTitle,
        artist: defaultArtist,
        duration: '3:00',
        previewUrl: objectUrl,
      };
    });

    setPendingMusic((prev) => [...prev, ...newEntries]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveItem = (tempId) => {
    if (playingId === tempId) {
      audioPreviewRef.current.pause();
      setPlayingId(null);
    }
    setPendingMusic((prev) => {
      const item = prev.find((m) => m.tempId === tempId);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((m) => m.tempId !== tempId);
    });
  };

  const handleClearAll = () => {
    audioPreviewRef.current.pause();
    setPlayingId(null);
    pendingMusic.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setPendingMusic([]);
  };

  const togglePlayPreview = (item) => {
    const audio = audioPreviewRef.current;
    if (playingId === item.tempId) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.src = item.previewUrl;
      audio.play().catch(() => {});
      setPlayingId(item.tempId);
      audio.onended = () => setPlayingId(null);
    }
  };

  const handleUpdateItem = (tempId, field, val) => {
    setPendingMusic((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pendingMusic.length === 0) {
      showToast('Zəhmət olmasa ən azı bir musiqi faylı seçin');
      return;
    }

    setIsSubmitting(true);
    audioPreviewRef.current.pause();
    setPlayingId(null);
    const total = pendingMusic.length;
    const uploadedSongs = [];

    try {
      // Hər bir audio faylı Cloudinary-yə yüklə
      for (let i = 0; i < total; i++) {
        const item = pendingMusic[i];
        setUploadProgress(`Buluda yüklənir: ${i + 1}/${total}...`);

        const cloudRes = await uploadAudioToCloudinary(item.file);

        let finalDuration = item.duration || '3:00';
        if (cloudRes.duration) {
          const m = Math.floor(cloudRes.duration / 60);
          const s = Math.floor(cloudRes.duration % 60);
          finalDuration = `${m}:${s < 10 ? '0' : ''}${s}`;
        }

        uploadedSongs.push({
          id: String(Date.now() + i),
          title: item.title.trim() || 'Adsız Mahnı',
          artist: item.artist.trim() || 'Bilinməyən İfaçı',
          url: cloudRes.url,
          public_id: cloudRes.public_id,
          duration: finalDuration,
          isFavorite: false,
        });

        // Yerli preview URL-ini təmizlə
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }

      await addMusic(uploadedSongs);
      showToast(`${total} musiqi əlavə edildi və yadda saxlanıldı! 🎵`);
      setPendingMusic([]);
      setUploadProgress('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('[Cloudinary Music Upload Error]:', err);
      showToast(err.message || 'Musiqilər yüklənərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <form className="admin-tab-form" onSubmit={handleSubmit}>
      {/* Gizli Çoxsaylı Audio Seçimi */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg"
        multiple
        className="admin-hidden-file-input"
        onChange={handleFilesChange}
      />

      {/* Audio Seçmə Sahəsi / Dropzone */}
      <div
        className="admin-dropzone glass-dropzone"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-icon-circle">
          <Upload size={28} className="dropzone-icon" />
        </div>
        <p className="dropzone-main-text">
          {pendingMusic.length > 0 ? 'Daha çox musiqi əlavə et' : 'Musiqiləri seçmək üçün toxunun'}
        </p>
        <p className="dropzone-sub-text">Bir və ya bir neçə audio fayl seçə bilərsiniz (Toplu yükləmə)</p>
      </div>

      {/* Seçilmiş Musiqilərin Siyahısı (Cloudinary-yə getməzdən qabaq yoxlamaq/silmək üçün) */}
      {pendingMusic.length > 0 && (
        <div className="pending-queue-section">
          <div className="queue-header-row">
            <span className="queue-title">
              Yüklənəcək Musiqilər ({pendingMusic.length})
            </span>
            <button
              type="button"
              className="queue-clear-all-btn"
              onClick={handleClearAll}
            >
              Hamısını sil
            </button>
          </div>

          <div className="pending-music-list">
            {pendingMusic.map((item, index) => {
              const isItemPlaying = playingId === item.tempId;
              return (
                <div key={item.tempId} className="pending-music-card glass-queue-card">
                  {/* Sol: Play/Pause önbaxış düyməsi */}
                  <button
                    type="button"
                    className={`queue-play-btn ${isItemPlaying ? 'playing' : ''}`}
                    onClick={() => togglePlayPreview(item)}
                    title={isItemPlaying ? 'Dayandır' : 'Dinlə'}
                  >
                    {isItemPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  {/* Orta: Redaktə edilə bilən Mahnı və İfaçı Sahəsi */}
                  <div className="queue-music-inputs">
                    <input
                      type="text"
                      className="queue-inline-input title-input"
                      placeholder="Mahnı adı"
                      value={item.title}
                      onChange={(e) =>
                        handleUpdateItem(item.tempId, 'title', e.target.value)
                      }
                      required
                    />
                    <div className="queue-meta-row">
                      <input
                        type="text"
                        className="queue-inline-input artist-input"
                        placeholder="İfaçı adı"
                        value={item.artist}
                        onChange={(e) =>
                          handleUpdateItem(item.tempId, 'artist', e.target.value)
                        }
                      />
                      <span className="queue-duration-badge">{item.duration}</span>
                    </div>
                  </div>

                  {/* Sağ: Siyahıdan silmə düyməsi */}
                  <button
                    type="button"
                    className="pending-item-delete-btn"
                    onClick={() => handleRemoveItem(item.tempId)}
                    title="Bu musiqini siyahıdan çıxar"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Təsdiq Düyməsi */}
      <button
        type="submit"
        className="admin-submit-btn glass-submit-btn"
        disabled={isSubmitting || pendingMusic.length === 0}
      >
        <CheckCircle size={19} />
        <span>
          {isSubmitting
            ? (uploadProgress || 'Yüklənir...')
            : pendingMusic.length > 0
            ? `${pendingMusic.length} Musiqini Əlavə Et`
            : 'Musiqiləri Əlavə Et'}
        </span>
      </button>
    </form>
  );
}
