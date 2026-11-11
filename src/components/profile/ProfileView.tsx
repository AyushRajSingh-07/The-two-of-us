import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Camera, Trash2, Heart, Check, Sparkles, Lock, ArrowLeftRight, Calendar, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { AVATAR_PRESETS, formatKolkataTime } from '../../lib/utils';
import { fireHeartConfetti } from '../common/Confetti';

export const ProfileView: React.FC = () => {
  const { couple, currentUser, partner, isPartner1Active, switchActiveUser, updateMyProfile, dailyCounter, triggerCheckin } = useAuth();

  // Selected tab: 'mine' (currently logged in partner) or 'partner'
  const [activeTab, setActiveTab] = useState<'mine' | 'partner'>('mine');

  // Determine who is Ayush and who is Vrishti
  const p1Name = couple?.partner1Name || 'Ayush';
  const p1Avatar = couple?.partner1Avatar || '';
  const p1Bio = couple?.partner1Bio || 'Adoring boyfriend & puzzle enthusiast. Always smiling when with Vrishti ❤️';

  const p2Name = couple?.partner2Name || 'Vrishti';
  const p2Avatar = couple?.partner2Avatar || '';
  const p2Bio = couple?.partner2Bio || 'Chief tea drinker, garden master, and Ayush’s favorite human ✨';

  // Active user's editable form state
  const isP1 = isPartner1Active;
  const myName = isP1 ? p1Name : p2Name;
  const myAvatar = isP1 ? p1Avatar : p2Avatar;
  const myBio = isP1 ? p1Bio : p2Bio;

  const [displayName, setDisplayName] = useState(myName);
  const [bio, setBio] = useState(myBio);

  // Avatar preview before saving
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Today checkin status
  const todayRecord = dailyCounter.todayRecord;
  const myCheckedIn = isP1 ? todayRecord.partner1CheckedIn : todayRecord.partner2CheckedIn;
  const myCheckedInAt = isP1 ? todayRecord.partner1CheckedInAt : todayRecord.partner2CheckedInAt;

  const partnerCheckedIn = isP1 ? todayRecord.partner2CheckedIn : todayRecord.partner1CheckedIn;
  const partnerCheckedInAt = isP1 ? todayRecord.partner2CheckedInAt : todayRecord.partner1CheckedInAt;

  // Handle local file selection for profile picture upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewAvatar(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Preset avatar selected
  const handleSelectPreset = (url: string) => {
    setPreviewAvatar(url);
    setErrorMessage('');
  };

  // Remove avatar preview
  const handleRemoveAvatar = () => {
    setPreviewAvatar('');
    setErrorMessage('');
  };

  // Revert preview
  const handleCancelPreview = () => {
    setPreviewAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save changes to current user's profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!displayName.trim()) {
      setErrorMessage('Display name cannot be empty.');
      return;
    }

    try {
      const finalAvatar = previewAvatar !== null ? previewAvatar : myAvatar;
      await updateMyProfile({
        name: displayName.trim(),
        avatar: finalAvatar,
        bio: bio.trim(),
      });

      setPreviewAvatar(null);
      setSaveSuccess(true);
      fireHeartConfetti();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save profile changes. Please try again.');
    }
  };

  const viewingOwn = activeTab === 'mine';
  const displayedName = viewingOwn ? displayName : partner.name;
  const displayedAvatar = viewingOwn 
    ? (previewAvatar !== null ? previewAvatar : myAvatar) 
    : (isP1 ? p2Avatar : p1Avatar);
  const displayedBio = viewingOwn ? bio : (isP1 ? p2Bio : p1Bio);
  const displayedCheckedIn = viewingOwn ? myCheckedIn : partnerCheckedIn;
  const displayedCheckedInAt = viewingOwn ? myCheckedInAt : partnerCheckedInAt;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Title & Profile Switcher Bar */}
      <div className="bg-white/80 backdrop-blur-xs rounded-3xl p-6 border border-rose-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-rose-100/70 text-rose-600 rounded-lg">
              <Heart className="w-4 h-4 fill-rose-500" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-warmgray-900">
              Profiles & Personas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-warmgray-500">
            Personalize your photo, romantic bio, and display name for our private website.
          </p>
        </div>

        {/* Switch Persona / Account Button */}
        <button
          onClick={switchActiveUser}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition shadow-2xs"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Switch view to {partner.name}</span>
        </button>
      </div>

      {/* Tabs: Viewing My Profile vs Partner's Profile */}
      <div className="flex items-center justify-center p-1.5 bg-rose-100/50 rounded-2xl max-w-md mx-auto border border-rose-200/50">
        <button
          onClick={() => setActiveTab('mine')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            viewingOwn
              ? 'bg-white text-rose-700 shadow-sm'
              : 'text-warmgray-600 hover:text-rose-600'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile ({currentUser.name})</span>
        </button>

        <button
          onClick={() => setActiveTab('partner')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            !viewingOwn
              ? 'bg-white text-rose-700 shadow-sm'
              : 'text-warmgray-600 hover:text-rose-600'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>{partner.name}&apos;s Profile</span>
        </button>
      </div>

      {/* Permissions Notification Alert */}
      {!viewingOwn && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              You are viewing {partner.name}&apos;s personal profile (Read-only)
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              To keep each account private, each person can only edit their own profile picture, display name, and bio.
              To make changes to this profile, click &ldquo;Switch view to {partner.name}&rdquo;.
            </p>
          </div>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-rose-100/60 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-rose-100">
          {/* Avatar Section */}
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              {displayedAvatar ? (
                <img
                  src={displayedAvatar}
                  alt={displayedName}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white ring-4 ring-rose-200 shadow-md"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-rose-200 to-rose-400 text-white flex items-center justify-center font-serif font-bold text-3xl border-4 border-white ring-4 ring-rose-200 shadow-md">
                  {displayedName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload trigger button (only for own profile) */}
              {viewingOwn && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload new profile photo"
                  className="absolute bottom-1 right-1 p-2.5 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 hover:scale-105 transition-all"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Check-in status pill */}
            <div className="mt-3">
              {displayedCheckedIn ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Checked in today ({formatKolkataTime(displayedCheckedInAt)} IST)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Waiting for check-in today
                </span>
              )}
            </div>
          </div>

          {/* User Summary Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif font-bold text-2xl text-warmgray-900">
                  {displayedName}
                </h2>
                <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  {viewingOwn ? (isP1 ? 'Partner 1 • Ayush' : 'Partner 2 • Vrishti') : (isP1 ? 'Partner 2 • Vrishti' : 'Partner 1 • Ayush')}
                </span>
              </div>

              {/* Shared Love Days Badge */}
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 rounded-xl border border-rose-200/60 self-center sm:self-start">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-bold text-rose-800">
                  {dailyCounter.sharedCount} Love Days
                </span>
              </div>
            </div>

            <p className="text-sm text-warmgray-600 italic bg-rose-50/40 p-3 rounded-2xl border border-rose-100/60 mt-2">
              &ldquo;{displayedBio || 'A quiet corner just for us.'}&rdquo;
            </p>
          </div>
        </div>

        {/* Live Photo Preview Controls (Shown when new photo or preset is selected before saving) */}
        {viewingOwn && previewAvatar !== null && (
          <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-200/60 text-rose-700 rounded-xl">
                <ImageIcon className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-rose-900">
                  Profile Picture Preview
                </h4>
                <p className="text-xs text-rose-700">
                  Review how your photo looks above, then click &ldquo;Save Profile Changes&rdquo; below to confirm.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelPreview}
                className="px-3 py-1.5 text-xs font-semibold text-warmgray-600 hover:text-warmgray-800 bg-white border border-warmgray-200 rounded-xl transition"
              >
                Revert
              </button>
            </div>
          </div>
        )}

        {/* Success & Error messages */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-medium animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile successfully updated! Your changes are synced across games, chat, and all pages.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm">
            {errorMessage}
          </div>
        )}

        {/* Edit Form (Only enabled when viewing own profile) */}
        {viewingOwn ? (
          <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ayush or Vrishti"
                className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
              />
              <p className="text-[11px] text-warmgray-500 mt-1">
                This name appears in chat, game turns, leaderboards, and invites.
              </p>
            </div>

            {/* Profile Picture Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider">
                  Choose or Upload Picture
                </label>
                {myAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Picture</span>
                  </button>
                )}
              </div>

              {/* Upload trigger button */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload from Computer / Phone</span>
                </button>
                <span className="text-xs text-warmgray-400">or pick a preset:</span>
              </div>

              {/* Preset Avatars Picker */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1">
                {AVATAR_PRESETS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(presetUrl)}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                      (previewAvatar === presetUrl || (!previewAvatar && myAvatar === presetUrl))
                        ? 'border-rose-600 ring-2 ring-rose-300'
                        : 'border-warmgray-200 hover:border-rose-300'
                    }`}
                  >
                    <img src={presetUrl} alt="Preset avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Romantic Bio / Status */}
            <div>
              <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-1.5">
                Personal Bio & Note
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Share a sweet thought, your nickname for your partner, or what makes you smile..."
                className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
              />
            </div>

            {/* Manual Checkin Button if Pending */}
            {!myCheckedIn && (
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-medium text-warmgray-700">
                    Haven&apos;t checked in today yet? Click to record your daily login.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await triggerCheckin();
                    fireHeartConfetti();
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
                >
                  Check In Now
                </button>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl text-sm font-semibold hover:from-rose-700 hover:to-rose-800 transition shadow-sm hover:shadow flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        ) : (
          /* Partner's profile view (Read-only + Sweet interactions) */
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-2">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                About {partner.name}
              </h4>
              <p className="text-sm text-warmgray-700">
                {displayedBio || 'No bio written yet.'}
              </p>
            </div>

            <div className="p-4 bg-champagne-50/60 rounded-2xl border border-champagne-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className="text-xs font-medium text-warmgray-800">
                  Want to update {partner.name}&apos;s profile?
                </span>
              </div>
              <button
                type="button"
                onClick={switchActiveUser}
                className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition"
              >
                Switch to {partner.name}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
