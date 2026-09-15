import React, { useState, useRef } from 'react';
import { Upload, Trash2, CheckCircle, Calendar, Plus } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatPhotoDate } from '../../utils/dateUtils';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';

export default function PhotoUploadTab({ onSuccess }) {
  const { photos, addPhotos } = useData();
  const { showToast } = useToast();

  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);

  const todayStr = formatPhotoDate(new Date().toISOString());

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map((file, idx) => ({
      tempId: `${Date.now()}-${idx}-${Math.random()}`,
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      previewUrl: URL.createObjectURL(file),
      date: new Date().toISOString(),
    }));

    setPendingPhotos((prev) => [...prev, ...newItems]);

    // Reset file input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveItem = (tempId) => {
    setPendingPhotos((prev) => {
      const item = prev.find((p) => p.tempId === tempId);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((p) => p.tempId !== tempId);
    });
  };

  const handleClearAll = () => {
    pendingPhotos.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setPendingPhotos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pendingPhotos.length === 0) {
      showToast('Zəhmət olmasa ən azı bir şəkil seçin');
      return;
    }

    setIsSubmitting(true);
    const total = pendingPhotos.length;
    const uploadedPhotos = [];

    try {
      // Hər bir şəkli Cloudinary-yə yüklə
      for (let i = 0; i < total; i++) {
        const item = pendingPhotos[i];
        setUploadProgress(`Buluda yüklənir: ${i + 1}/${total}...`);

        const cloudRes = await uploadImageToCloudinary(item.file);

        uploadedPhotos.push({
          id: String(Date.now() + i),
          name: `Xatirə ${photos.length + i + 1}`,
          url: cloudRes.url,
          public_id: cloudRes.public_id,
          width: cloudRes.width,
          height: cloudRes.height,
          isFavorite: false,
          created_at: item.date,
        });

        // Yerli preview URL-ini təmizlə
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }

      await addPhotos(uploadedPhotos);
      showToast(`${total} şəkil əlavə edildi və yadda saxlanıldı! 📸`);
      setPendingPhotos([]);
      setUploadProgress('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('[Cloudinary Upload Error]:', err);
      showToast(err.message || 'Şəkillər yüklənərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <form className="admin-tab-form" onSubmit={handleSubmit}>
      {/* Gizli Çoxsaylı Fayl Seçimi */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="admin-hidden-file-input"
        onChange={handleFilesChange}
      />

      {/* Şəkil Seçmə Sahəsi / Dropzone */}
      <div
        className="admin-dropzone glass-dropzone"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-icon-circle">
          <Upload size={28} className="dropzone-icon" />
        </div>
        <p className="dropzone-main-text">
          {pendingPhotos.length > 0 ? 'Daha çox şəkil əlavə et' : 'Şəkilləri seçmək üçün toxunun'}
        </p>
        <p className="dropzone-sub-text">Bir və ya bir neçə şəkil seçə bilərsiniz (Toplu yükləmə)</p>
      </div>

      {/* Seçilmiş Şəkillərin Siyahısı (Cloudinary-yə göndərməzdən əvvəl yoxlamaq/silmək üçün) */}
      {pendingPhotos.length > 0 && (
        <div className="pending-queue-section">
          <div className="queue-header-row">
            <span className="queue-title">
              Yüklənəcək Şəkillər ({pendingPhotos.length})
            </span>
            <button
              type="button"
              className="queue-clear-all-btn"
              onClick={handleClearAll}
            >
              Hamısını sil
            </button>
          </div>

          <div className="pending-photos-list">
            {pendingPhotos.map((item, index) => (
              <div key={item.tempId} className="pending-photo-card glass-queue-card">
                {/* Mini şəkil */}
                <div className="pending-photo-thumb-box">
                  <img src={item.previewUrl} alt={`Foto ${index + 1}`} className="pending-photo-thumb" />
                  <span className="pending-index-badge">{index + 1}</span>
                </div>

                {/* Məlumatlar */}
                <div className="pending-item-details">
                  <p className="pending-item-filename">{item.name}</p>
                  <p className="pending-item-meta">{item.size} • {todayStr}</p>
                </div>

                {/* Siyahıdan silmə düyməsi */}
                <button
                  type="button"
                  className="pending-item-delete-btn"
                  onClick={() => handleRemoveItem(item.tempId)}
                  title="Siyahıdan çıxar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avtomatik Tarix Məlumatı */}
      <div className="admin-date-badge-row">
        <Calendar size={15} className="date-badge-icon" />
        <span>Tarix: <strong>{todayStr}</strong> (avtomatik qeyd olunacaq)</span>
      </div>

      {/* Təsdiq Düyməsi */}
      <button
        type="submit"
        className="admin-submit-btn glass-submit-btn"
        disabled={isSubmitting || pendingPhotos.length === 0}
      >
        <CheckCircle size={19} />
        <span>
          {isSubmitting
            ? (uploadProgress || 'Yüklənir...')
            : pendingPhotos.length > 0
            ? `${pendingPhotos.length} Şəkli Əlavə Et`
            : 'Şəkilləri Əlavə Et'}
        </span>
      </button>
    </form>
  );
}
