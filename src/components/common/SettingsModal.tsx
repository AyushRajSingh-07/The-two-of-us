import React, { useState } from 'react';
import { X, Heart, Calendar, Key, User, Check, Sparkles, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_PRESETS, calculateTimeTogether } from '../../lib/utils';
import { fireHeartConfetti } from './Confetti';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { couple, updateCoupleSettings, isSupabase } = useAuth();

  const [partner1Name, setPartner1Name] = useState(couple?.partner1Name || '');
  const [partner1Avatar, setPartner1Avatar] = useState(couple?.partner1Avatar || '');
  const [partner2Name, setPartner2Name] = useState(couple?.partner2Name || '');
  const [partner2Avatar, setPartner2Avatar] = useState(couple?.partner2Avatar || '');
  const [anniversaryDate, setAnniversaryDate] = useState(couple?.anniversaryDate || '');
  const [welcomeMessage, setWelcomeMessage] = useState(couple?.welcomeMessage || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !couple) return null;

  const timeStats = calculateTimeTogether(anniversaryDate);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCoupleSettings({
      partner1Name: partner1Name.trim() || 'Partner 1',
      partner1Avatar,
      partner2Name: partner2Name.trim() || 'Partner 2',
      partner2Avatar,
      anniversaryDate,
      welcomeMessage: welcomeMessage.trim(),
    });
    setSavedSuccess(true);
    fireHeartConfetti();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(couple.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-rose-100 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-warmgray-800">Our Sanctuary Settings</h2>
              <p className="text-xs text-warmgray-500">Personalize our names, dates, and look</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-warmgray-400 hover:text-warmgray-700 hover:bg-warmgray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Partner 1 Info */}
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
            <h3 className="text-sm font-semibold text-rose-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-rose-600" /> Partner 1 (You / Creator)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-warmgray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={partner1Name}
                  onChange={(e) => setPartner1Name(e.target.value)}
                  placeholder="e.g. Ayush"
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-warmgray-600 mb-1">Avatar Photo URL</label>
                <input
                  type="text"
                  value={partner1Avatar}
                  onChange={(e) => setPartner1Avatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>
            {/* Quick avatar selection */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] text-warmgray-500">Quick avatars:</span>
              <div className="flex gap-1.5">
                {AVATAR_PRESETS.slice(0, 3).map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPartner1Avatar(url)}
                    className="w-7 h-7 rounded-full overflow-hidden border-2 border-transparent hover:border-rose-400 transition"
                  >
                    <img src={url} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Partner 2 Info */}
          <div className="p-4 bg-champagne-50/70 rounded-2xl border border-champagne-200">
            <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-700" /> Partner 2 (Your Girlfriend / Love)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-warmgray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={partner2Name}
                  onChange={(e) => setPartner2Name(e.target.value)}
                  placeholder="e.g. Vrishti"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-warmgray-600 mb-1">Avatar Photo URL</label>
                <input
                  type="text"
                  value={partner2Avatar}
                  onChange={(e) => setPartner2Avatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            {/* Quick avatar selection */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] text-warmgray-500">Quick avatars:</span>
              <div className="flex gap-1.5">
                {AVATAR_PRESETS.slice(3, 6).map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPartner2Avatar(url)}
                    className="w-7 h-7 rounded-full overflow-hidden border-2 border-transparent hover:border-amber-400 transition"
                  >
                    <img src={url} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Anniversary & Live Counter */}
          <div>
            <label className="block text-xs font-semibold text-warmgray-700 mb-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" /> Our Anniversary / Relationship Start Date
            </label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            {timeStats.totalDays > 0 && (
              <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50/60 p-2 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  Together for <strong>{timeStats.totalDays} days</strong> ({timeStats.years}y {timeStats.months}m {timeStats.days}d) • {timeStats.nextAnniversaryDays} days until next anniversary!
                </span>
              </div>
            )}
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-xs font-semibold text-warmgray-700 mb-1.5">
              Sanctuary Welcome Message / Love Note
            </label>
            <textarea
              rows={2}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="A sweet personal message displayed at the top of your space..."
              className="w-full px-3.5 py-2 rounded-xl border border-warmgray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Invitation Code & System Status */}
          <div className="p-4 bg-warmgray-50 rounded-2xl border border-warmgray-200/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-warmgray-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-warmgray-500" /> Couple Invite Code
                </span>
                <p className="text-[11px] text-warmgray-500 mt-0.5">
                  Share this code with your partner to link her account
                </p>
              </div>
              <button
                type="button"
                onClick={copyInvite}
                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                <span>{copiedCode ? 'Copied!' : couple.inviteCode}</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-warmgray-200/60 flex items-center justify-between text-xs text-warmgray-500">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Backend Mode:
              </span>
              <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                isSupabase ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {isSupabase ? 'Supabase Live Connected' : 'Local Sandbox Mode (Real-time Ready)'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-warmgray-600 hover:text-warmgray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-rose-200 transition flex items-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
