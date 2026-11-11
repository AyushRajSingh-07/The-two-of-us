import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../lib/store';
import { fireHeartConfetti } from '../common/Confetti';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
  existingAlbums: string[];
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onUploaded,
  existingAlbums,
}) => {
  const { couple, currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [album, setAlbum] = useState('Date Nights');
  const [customAlbum, setCustomAlbum] = useState('');
  const [dateTaken, setDateTaken] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !couple) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    validateAndSetFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    validateAndSetFile(dropped);
  };

  const validateAndSetFile = (f: File) => {
    setErrorMsg('');
    if (!f.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size must be smaller than 10MB.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      setErrorMsg('Please choose a photo to upload.');
      return;
    }

    setIsUploading(true);
    setProgress(20);

    // Simulated upload progress steps for feedback
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 25 : prev));
    }, 150);

    const chosenAlbum = customAlbum.trim() ? customAlbum.trim() : album;

    try {
      await DataStore.uploadPhoto({
        spaceId: couple.id,
        uploaderId: currentUser.id,
        uploaderName: currentUser.name,
        url: previewUrl,
        caption: caption.trim() || 'A sweet moment together',
        album: chosenAlbum,
        dateTaken,
        isFavorite: false,
      });

      clearInterval(interval);
      setProgress(100);
      fireHeartConfetti();

      setTimeout(() => {
        setIsUploading(false);
        onUploaded();
        onClose();
        // Reset state
        setFile(null);
        setPreviewUrl(null);
        setCaption('');
        setProgress(0);
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setErrorMsg(err.message || 'Upload failed, please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in transition-colors">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#191422] rounded-3xl shadow-2xl border border-rose-100 dark:border-rose-900/50 p-6 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/40 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-warmgray-800 dark:text-warmgray-100">Add to Our Gallery</h2>
              <p className="text-xs text-warmgray-500 dark:text-warmgray-400">Capture a private memory forever</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-warmgray-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Dropzone */}
          {!previewUrl ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-rose-200 dark:border-rose-900/60 hover:border-rose-400 bg-champagne-50/40 dark:bg-[#20182a]/60 hover:bg-rose-50/40 dark:hover:bg-[#261d32] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              <div className="p-3 bg-white dark:bg-[#2a2036] text-rose-500 dark:text-rose-400 rounded-full shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-warmgray-700 dark:text-warmgray-200">
                Click or drag & drop a photo here
              </p>
              <p className="text-[11px] text-warmgray-400 dark:text-warmgray-400">
                JPG, PNG, WebP up to 10MB. Stored completely privately.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden max-h-56 bg-black/5 dark:bg-black/30 flex items-center justify-center">
              <img src={previewUrl} alt="Upload preview" className="max-h-56 w-auto object-contain rounded-2xl" />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-warmgray-700 dark:text-warmgray-300 mb-1">
              Sweet Caption / Memory Note
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Where was this? What made this moment special?"
              className="w-full px-3.5 py-2 border border-warmgray-200 dark:border-rose-900/40 bg-white dark:bg-[#251d30] text-warmgray-800 dark:text-warmgray-100 placeholder-warmgray-400 dark:placeholder-warmgray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Album & Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warmgray-700 dark:text-warmgray-300 mb-1">Album / Collection</label>
              <select
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full px-3 py-2 border border-warmgray-200 dark:border-rose-900/40 rounded-xl text-xs bg-white dark:bg-[#251d30] text-warmgray-800 dark:text-warmgray-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {Array.from(new Set(['Date Nights', 'Adventures', 'Candid Moments', 'Milestones', ...existingAlbums])).map((alb) => (
                  <option key={alb} value={alb} className="dark:bg-[#1f1729]">
                    {alb}
                  </option>
                ))}
                <option value="__NEW__" className="dark:bg-[#1f1729]">+ Create New Album...</option>
              </select>
              {album === '__NEW__' && (
                <input
                  type="text"
                  value={customAlbum}
                  onChange={(e) => setCustomAlbum(e.target.value)}
                  placeholder="New album name..."
                  className="mt-1.5 w-full px-3 py-1.5 border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-[#251d30] text-warmgray-800 dark:text-warmgray-100 rounded-xl text-xs"
                  autoFocus
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-warmgray-700 dark:text-warmgray-300 mb-1">Date Taken</label>
              <input
                type="date"
                value={dateTaken}
                onChange={(e) => setDateTaken(e.target.value)}
                className="w-full px-3 py-2 border border-warmgray-200 dark:border-rose-900/40 rounded-xl text-xs bg-white dark:bg-[#251d30] text-warmgray-800 dark:text-warmgray-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-rose-600 dark:text-rose-400">
                <span>Encrypting & uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-rose-100 dark:bg-rose-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-medium text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-800 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!previewUrl || isUploading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              {progress === 100 ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Save Photo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
