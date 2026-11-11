import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Trash2, Calendar, User, Tag } from 'lucide-react';
import { PhotoItem } from '../../types';
import { formatDate } from '../../lib/utils';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  onClose,
  onPrev,
  onNext,
  onToggleFavorite,
  onDelete,
}) => {
  if (!photo) return null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this memory?')) {
      onDelete(photo.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fade-in select-none">
      {/* Top action bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => onToggleFavorite(photo.id)}
          className={`p-2.5 rounded-full transition ${
            photo.isFavorite
              ? 'bg-rose-600 text-white shadow-lg'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={photo.isFavorite ? 'Favorited' : 'Add to Favorites'}
        >
          <Heart className={`w-5 h-5 ${photo.isFavorite ? 'fill-white' : ''}`} />
        </button>

        <button
          onClick={handleDelete}
          className="p-2.5 rounded-full bg-white/10 hover:bg-rose-600/80 text-white transition"
          title="Delete photo"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav arrow Left */}
      {onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
          title="Previous photo (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Nav arrow Right */}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
          title="Next photo (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image & Details Container */}
      <div className="max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center overflow-hidden">
        <img
          src={photo.url}
          alt={photo.caption}
          className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
        />

        {/* Caption & Metadata card */}
        <div className="mt-4 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white max-w-xl w-full text-center">
          <p className="font-serif text-base sm:text-lg italic text-rose-100">
            "{photo.caption}"
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-warmgray-300">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-300" />
              {formatDate(photo.dateTaken)}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-300" />
              {photo.album}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-rose-300" />
              {photo.uploaderName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
