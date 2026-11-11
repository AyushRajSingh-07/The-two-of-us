import React, { useState, useEffect } from 'react';
import { Plus, Heart, Search, Filter, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PhotoItem } from '../../types';
import { DataStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { PhotoUploadModal } from './PhotoUploadModal';
import { PhotoLightbox } from './PhotoLightbox';

export const PhotosView: React.FC = () => {
  const { couple } = useAuth();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All Photos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const loadPhotos = async () => {
    if (!couple) return;
    const items = await DataStore.getPhotos(couple.id);
    setPhotos(items);
  };

  useEffect(() => {
    loadPhotos();
    const unsub = DataStore.onSync((e) => {
      if (e.type === 'PHOTOS_UPDATED') {
        setPhotos(e.payload);
      }
    });
    return unsub;
  }, [couple?.id]);

  const handleToggleFavorite = async (photoId: string) => {
    await DataStore.toggleFavoritePhoto(photoId);
    await loadPhotos();
  };

  const handleDelete = async (photoId: string) => {
    await DataStore.deletePhoto(photoId);
    await loadPhotos();
  };

  // Collect distinct albums
  const existingAlbums = Array.from(new Set(photos.map((p) => p.album).filter(Boolean)));
  const allFilterTabs = ['All Photos', '❤️ Favorites', ...existingAlbums];

  // Filter photos
  const filteredPhotos = photos.filter((p) => {
    const matchesAlbum =
      selectedAlbum === 'All Photos'
        ? true
        : selectedAlbum === '❤️ Favorites'
        ? p.isFavorite
        : p.album === selectedAlbum;
    const matchesSearch =
      !searchQuery.trim() ||
      p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.album.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAlbum && matchesSearch;
  });

  const activePhoto = activePhotoIndex !== null ? filteredPhotos[activePhotoIndex] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-100/70 via-champagne-100/60 to-rose-50/70 rounded-3xl p-6 sm:p-8 border border-rose-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Private Keepsake</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-warmgray-900">
              Our Shared Memories
            </h1>
            <p className="text-sm text-warmgray-600 mt-1">
              A private collection of our adventures, date nights, and candid moments.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-semibold text-sm shadow-md hover:shadow-rose-200 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Memory</span>
          </button>
        </div>
      </div>

      {/* Album Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Album Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {allFilterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedAlbum(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedAlbum === tab
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white hover:bg-rose-50 text-warmgray-600 border border-warmgray-200/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warmgray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search our memories..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-warmgray-200 rounded-xl text-xs text-warmgray-800 placeholder-warmgray-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-lg text-warmgray-800">No photos found</h3>
          <p className="text-xs text-warmgray-500 mt-1 mb-4">
            {searchQuery
              ? 'Try adjusting your search query or album filter.'
              : 'Upload your first couple photo together to start filling this gallery!'}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
          >
            Upload Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setActivePhotoIndex(index)}
              className="group bg-white rounded-3xl overflow-hidden border border-rose-100/80 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              {/* Photo Image */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-warmgray-100">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs text-white font-medium">Click to view full size</span>
                </div>

                {/* Favorite Heart Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(photo.id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-full transition shadow-md ${
                    photo.isFavorite
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/80 hover:bg-white text-warmgray-600'
                  }`}
                  title={photo.isFavorite ? 'Favorited' : 'Add to Favorites'}
                >
                  <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-white' : ''}`} />
                </button>

                {/* Album Badge */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-rose-700 shadow-xs">
                  {photo.album}
                </div>
              </div>

              {/* Photo Details / Polaroid Style */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="font-serif text-sm text-warmgray-800 line-clamp-2 italic">
                  "{photo.caption}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-warmgray-400 mt-3 pt-2 border-t border-rose-50">
                  <span>{formatDate(photo.dateTaken)}</span>
                  <span>by {photo.uploaderName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <PhotoLightbox
        photo={activePhoto}
        onClose={() => setActivePhotoIndex(null)}
        onPrev={
          activePhotoIndex !== null && activePhotoIndex > 0
            ? () => setActivePhotoIndex(activePhotoIndex - 1)
            : undefined
        }
        onNext={
          activePhotoIndex !== null && activePhotoIndex < filteredPhotos.length - 1
            ? () => setActivePhotoIndex(activePhotoIndex + 1)
            : undefined
        }
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />

      {/* Upload Modal */}
      <PhotoUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={loadPhotos}
        existingAlbums={existingAlbums}
      />
    </div>
  );
};
