import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  Calendar,
  Globe,
  Bell,
  Shield,
  Key,
  User,
  Check,
  Sparkles,
  ArrowLeftRight,
  Clock,
  Lock,
  LogOut,
  Volume2,
  Image,
  Database,
  Copy,
  ExternalLink
} from 'lucide-react';
import { calculateTimeTogether, formatKolkataTime } from '../../lib/utils';
import { fireHeartConfetti } from '../common/Confetti';

interface SettingsViewProps {
  onNavigateToProfile?: () => void;
}

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - India Standard Time)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT / BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToProfile }) => {
  const {
    couple,
    currentUser,
    partner,
    isPartner1Active,
    switchActiveUser,
    updateCoupleSettings,
    dailyCounter,
    isSupabase,
  } = useAuth();

  // Shared couple settings state
  const [anniversaryDate, setAnniversaryDate] = useState(couple?.anniversaryDate || '');
  const [welcomeMessage, setWelcomeMessage] = useState(couple?.welcomeMessage || '');
  const [sharedTimezone, setSharedTimezone] = useState(couple?.sharedTimezone || 'Asia/Kolkata');
  const [privatePhotosOnly, setPrivatePhotosOnly] = useState(couple?.privatePhotosOnly ?? true);
  const [allowPhotoDownloads, setAllowPhotoDownloads] = useState(couple?.allowPhotoDownloads ?? true);

  // Personal preferences for active user
  const [reminderDailyCheckin, setReminderDailyCheckin] = useState(couple?.reminderDailyCheckin ?? true);
  const [reminderDateNight, setReminderDateNight] = useState(couple?.reminderDateNight ?? true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(couple?.soundEffectsEnabled ?? true);

  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  const timeStats = calculateTimeTogether(anniversaryDate);

  const handleCopyInvite = () => {
    if (couple?.inviteCode) {
      navigator.clipboard.writeText(couple.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      await updateCoupleSettings({
        anniversaryDate,
        welcomeMessage: welcomeMessage.trim(),
        sharedTimezone,
        privatePhotosOnly,
        allowPhotoDownloads,
        reminderDailyCheckin,
        reminderDateNight,
        soundEffectsEnabled,
      });

      setSaveSuccess(true);
      fireHeartConfetti();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save settings. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xs rounded-3xl p-6 border border-rose-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-warmgray-900">
              Sanctuary Settings
            </h1>
            <p className="text-xs sm:text-sm text-warmgray-500">
              Manage your shared couple space, privacy, reminders, and account details.
            </p>
          </div>
        </div>

        {/* Active Account Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-champagne-100/70 border border-champagne-300/60 rounded-xl text-xs">
          <User className="w-3.5 h-3.5 text-champagne-700" />
          <span className="text-warmgray-600">Active persona:</span>
          <strong className="text-rose-700 font-bold">{currentUser.name}</strong>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-sm font-medium animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Sanctuary settings updated successfully! All changes are synced securely.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ========================================================= */}
        {/* SECTION 1: Shared Couple Settings                         */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Heart className="w-4 h-4 text-rose-600" />
              </span>
              <div>
                <h2 className="font-serif font-bold text-lg text-warmgray-900">
                  Shared Couple Settings
                </h2>
                <p className="text-xs text-warmgray-500">
                  Settings shared equally between Ayush & Vrishti.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Shared Space
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Anniversary Date */}
            <div>
              <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Anniversary / Important Date</span>
              </label>
              <input
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
              />
              <div className="mt-2 text-xs text-rose-700 font-medium bg-rose-50/60 p-2.5 rounded-xl border border-rose-100 flex items-center justify-between">
                <span>Together for:</span>
                <strong>{timeStats.totalDays} Days ({timeStats.years}y {timeStats.months}m {timeStats.days}d)</strong>
              </div>
            </div>

            {/* Shared Timezone */}
            <div>
              <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-rose-500" />
                <span>Shared Timezone</span>
              </label>
              <select
                value={sharedTimezone}
                onChange={(e) => setSharedTimezone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-warmgray-500">
                Daily check-ins transition at midnight in this timezone (default: Asia/Kolkata).
              </p>
            </div>
          </div>

          {/* Shared Welcome Message */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-1.5">
              Shared Welcome Banner Message
            </label>
            <input
              type="text"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="e.g. Welcome to our private sanctuary. A quiet corner just for us."
              className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
            />
            <p className="text-[11px] text-warmgray-500 mt-1">
              Displayed prominently at the top of the app for both of you.
            </p>
          </div>

          {/* Love Day Counter Overview Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50/80 via-white to-champagne-50/80 rounded-2xl border border-rose-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <h3 className="font-serif font-bold text-base text-warmgray-900">
                  Shared Love Day Counter: {dailyCounter.sharedCount} Days
                </h3>
              </div>
              <p className="text-xs text-warmgray-600 max-w-xl">
                Current baseline is set to 612 days. Each calendar day in <strong>{sharedTimezone}</strong> where both Ayush and Vrishti log in, this counter increases permanently by +1.
              </p>
              <div className="text-[11px] text-rose-700 font-medium flex items-center gap-3 pt-1">
                <span>{couple?.partner1Name}: {dailyCounter.todayRecord.partner1CheckedIn ? `Checked In (${formatKolkataTime(dailyCounter.todayRecord.partner1CheckedInAt)})` : 'Pending'}</span>
                <span>•</span>
                <span>{couple?.partner2Name}: {dailyCounter.todayRecord.partner2CheckedIn ? `Checked In (${formatKolkataTime(dailyCounter.todayRecord.partner2CheckedInAt)})` : 'Pending'}</span>
              </div>
            </div>

            <div className="px-4 py-2 bg-rose-600 text-white rounded-2xl font-serif font-bold text-xl text-center self-stretch sm:self-auto shadow-xs">
              {dailyCounter.sharedCount}
              <span className="block text-[10px] uppercase font-sans font-medium text-rose-200">
                Love Days
              </span>
            </div>
          </div>

          {/* Sanctuary Invite Code & Access */}
          <div className="p-4 bg-warmgray-50/80 rounded-2xl border border-warmgray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-warmgray-600" />
                <h4 className="text-xs font-bold text-warmgray-800 uppercase tracking-wider">
                  Sanctuary Secret Invite Code
                </h4>
              </div>
              <p className="text-xs text-warmgray-500 mt-0.5">
                Use this private code to pair or sign in from a phone or second device.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <code className="px-3 py-1.5 bg-white border border-warmgray-300 rounded-xl font-mono text-sm font-bold text-rose-700">
                {couple?.inviteCode || 'US-FOREVER-2024'}
              </code>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-xs font-semibold text-rose-700 border border-rose-200 rounded-xl transition flex items-center gap-1 shadow-2xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: General & Personal Preferences                 */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <User className="w-4 h-4 text-rose-600" />
              </span>
              <div>
                <h2 className="font-serif font-bold text-lg text-warmgray-900">
                  Account & Reminders ({currentUser.name})
                </h2>
                <p className="text-xs text-warmgray-500">
                  Personal preferences specific to your account session.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-warmgray-700 bg-warmgray-100 px-2.5 py-1 rounded-full">
              Personal
            </span>
          </div>

          {/* Persona Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-rose-200 shadow-xs"
              />
              <div>
                <span className="font-serif font-bold text-sm text-warmgray-900 block">
                  {currentUser.name}
                </span>
                <span className="text-xs text-warmgray-500">
                  {isPartner1Active ? 'Partner 1 (Creator)' : 'Partner 2 (Partner)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToProfile && (
                <button
                  type="button"
                  onClick={onNavigateToProfile}
                  className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition"
                >
                  Edit My Profile & Photo
                </button>
              )}
              <button
                type="button"
                onClick={switchActiveUser}
                className="px-3.5 py-1.5 text-xs font-semibold text-warmgray-700 bg-white border border-warmgray-200 hover:bg-warmgray-50 rounded-xl transition flex items-center gap-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Switch to {partner.name}</span>
              </button>
            </div>
          </div>

          {/* Optional Reminders & Notifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-warmgray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-rose-500" />
              <span>Reminders & Notifications</span>
            </h3>

            {/* Daily Check-in Reminder */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/40 hover:bg-warmgray-50 cursor-pointer transition">
              <div>
                <span className="font-semibold text-xs sm:text-sm text-warmgray-900 block">
                  Daily Check-in Reminder
                </span>
                <span className="text-xs text-warmgray-500">
                  Gentle banner alert when today&apos;s Love Day count is waiting for your check-in.
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderDailyCheckin}
                onChange={(e) => setReminderDailyCheckin(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400"
              />
            </label>

            {/* Date Night & Anniversary Reminder */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/40 hover:bg-warmgray-50 cursor-pointer transition">
              <div>
                <span className="font-semibold text-xs sm:text-sm text-warmgray-900 block">
                  Anniversary & Date Night Milestones
                </span>
                <span className="text-xs text-warmgray-500">
                  Special celebration badges on monthly anniversaries and key relationship dates.
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderDateNight}
                onChange={(e) => setReminderDateNight(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400"
              />
            </label>

            {/* Interactive Sound Effects */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/40 hover:bg-warmgray-50 cursor-pointer transition">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-xs sm:text-sm text-warmgray-900 block">
                    Interactive Confetti & Sound Effects
                  </span>
                  <span className="text-xs text-warmgray-500">
                    Play celebratory heart confetti when saving milestones or winning co-op games.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400"
              />
            </label>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: Privacy & Security Controls                   */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Shield className="w-4 h-4 text-rose-600" />
              </span>
              <div>
                <h2 className="font-serif font-bold text-lg text-warmgray-900">
                  Privacy & Storage Controls
                </h2>
                <p className="text-xs text-warmgray-500">
                  Strict row-level protection and private file storage for the two of you.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Private 2-Person
            </span>
          </div>

          <div className="space-y-3">
            {/* Private Photos Only */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/40 hover:bg-warmgray-50 cursor-pointer transition">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-xs sm:text-sm text-warmgray-900 block">
                    Private Shared Gallery Only
                  </span>
                  <span className="text-xs text-warmgray-500">
                    Ensure uploaded photos are only accessible to Ayush and Vrishti.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={privatePhotosOnly}
                onChange={(e) => setPrivatePhotosOnly(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400"
              />
            </label>

            {/* Allow Downloads */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 bg-warmgray-50/40 hover:bg-warmgray-50 cursor-pointer transition">
              <div>
                <span className="font-semibold text-xs sm:text-sm text-warmgray-900 block">
                  Allow High-Resolution Photo Downloads
                </span>
                <span className="text-xs text-warmgray-500">
                  Enable download button in full-screen gallery viewer.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowPhotoDownloads}
                onChange={(e) => setAllowPhotoDownloads(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400"
              />
            </label>
          </div>

          {/* Database / Backend Status */}
          <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-600" />
              <div>
                <strong className="text-warmgray-800 block">Backend Storage Engine:</strong>
                <span className="text-warmgray-500">
                  {isSupabase
                    ? 'Connected to Supabase PostgreSQL & Private Storage Bucket with RLS'
                    : 'Encrypted Local & Cross-Device Sync Sandbox (Production Ready for Supabase)'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
              isSupabase ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isSupabase ? 'Supabase Active' : 'Private Local'}
            </span>
          </div>

          {/* Sign Out / Reset Session */}
          <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
            <span className="text-xs text-warmgray-500">
              Want to lock the screen or switch device?
            </span>
            <button
              type="button"
              onClick={() => setShowSignoutConfirm(true)}
              className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Switch Session</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl text-sm font-semibold hover:from-rose-700 hover:to-rose-800 transition shadow-sm hover:shadow flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save All Sanctuary Settings</span>
          </button>
        </div>
      </form>

      {/* Signout Confirmation Modal */}
      {showSignoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-rose-100 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-warmgray-900">
              Sign Out from Sanctuary?
            </h3>
            <p className="text-xs text-warmgray-600">
              You can easily log back in using your couple invite code (<code>{couple?.inviteCode}</code>) at any time.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSignoutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-warmgray-600 hover:bg-warmgray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  switchActiveUser();
                  setShowSignoutConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
