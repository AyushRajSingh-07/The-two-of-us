import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  ExternalLink,
  Sun,
  Moon,
  Server,
  Wifi,
} from 'lucide-react';
import { calculateTimeTogether, formatKolkataTime } from '../../lib/utils';
import { fireHeartConfetti } from '../common/Confetti';
import { Api, getBackendUrl } from '../../lib/api';

interface SettingsViewProps {
  onNavigateToProfile?: () => void;
  onOpenServerModal?: () => void;
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

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToProfile, onOpenServerModal }) => {
  const {
    couple,
    currentUser,
    partner,
    isPartner1Active,
    switchActiveUser,
    updateCoupleSettings,
    dailyCounter,
    isSupabase,
    logoutUser,
    isServerOnline,
  } = useAuth();
  const { isDark, theme, setTheme } = useTheme();

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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  const timeStats = calculateTimeTogether(anniversaryDate);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatusMsg(null);
    if (!currentPassword || !newPassword) {
      setPasswordStatusMsg({ type: 'error', text: 'Please fill in both current and new passwords.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatusMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await Api.changePassword(currentPassword, newPassword);
      setPasswordStatusMsg({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordStatusMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

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
      <div className="bg-white/80 dark:bg-[#15111c]/90 backdrop-blur-xs rounded-3xl p-6 border border-rose-100 dark:border-rose-900/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-2xl">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-warmgray-900 dark:text-warmgray-100">
              Sanctuary Settings
            </h1>
            <p className="text-xs sm:text-sm text-warmgray-500 dark:text-warmgray-400">
              Manage your shared couple space, privacy, appearance, and account details.
            </p>
          </div>
        </div>

        {/* Active Account Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-champagne-100/70 dark:bg-[#281f33] border border-champagne-300/60 dark:border-rose-900/40 rounded-xl text-xs">
          <User className="w-3.5 h-3.5 text-champagne-700 dark:text-rose-300" />
          <span className="text-warmgray-600 dark:text-warmgray-300">Active persona:</span>
          <strong className="text-rose-700 dark:text-rose-300 font-bold">{currentUser.name}</strong>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-sm font-medium animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Sanctuary settings updated successfully! All changes are synced securely.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ========================================================= */}
        {/* SECTION 1: Shared Couple Settings                         */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-[#191422] rounded-3xl p-6 sm:p-8 border border-rose-100 dark:border-rose-900/40 shadow-sm space-y-6 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </span>
              <div>
                <h2 className="font-serif font-bold text-lg text-warmgray-900 dark:text-warmgray-100">
                  Shared Couple Settings
                </h2>
                <p className="text-xs text-warmgray-500 dark:text-warmgray-400">
                  Settings shared equally between Ayush & Vrishti.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800/60">
              Shared Space
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Anniversary Date */}
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Anniversary / Important Date</span>
              </label>
              <input
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/40 bg-warmgray-50/50 dark:bg-[#251d30] text-warmgray-900 dark:text-warmgray-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white dark:focus:bg-[#2c223a] transition"
              />
              <div className="mt-2 text-xs text-rose-700 dark:text-rose-300 font-medium bg-rose-50/60 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                <span>Together for:</span>
                <strong>{timeStats.totalDays} Days ({timeStats.years}y {timeStats.months}m {timeStats.days}d)</strong>
              </div>
            </div>

            {/* Shared Timezone */}
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-rose-500" />
                <span>Shared Timezone</span>
              </label>
              <select
                value={sharedTimezone}
                onChange={(e) => setSharedTimezone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/40 bg-warmgray-50/50 dark:bg-[#251d30] text-warmgray-900 dark:text-warmgray-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white dark:focus:bg-[#2c223a] transition"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value} className="dark:bg-[#1e1728]">
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-warmgray-500 dark:text-warmgray-400">
                Daily check-ins transition at midnight in this timezone (default: Asia/Kolkata).
              </p>
            </div>
          </div>

          {/* Shared Welcome Message */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-wider mb-1.5">
              Shared Welcome Banner Message
            </label>
            <input
              type="text"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="e.g. Welcome to our private sanctuary. A quiet corner just for us."
              className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/40 bg-warmgray-50/50 dark:bg-[#251d30] text-warmgray-900 dark:text-warmgray-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white dark:focus:bg-[#2c223a] transition"
            />
            <p className="text-[11px] text-warmgray-500 dark:text-warmgray-400 mt-1">
              Displayed prominently at the top of the app for both of you.
            </p>
          </div>

          {/* Love Day Counter Overview Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50/80 via-white to-champagne-50/80 dark:from-[#231b2e] dark:via-[#1e1628] dark:to-[#251a2d] rounded-2xl border border-rose-200/70 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="font-serif font-bold text-base text-warmgray-900 dark:text-warmgray-100">
                  Shared Love Day Counter: {dailyCounter.sharedCount} Days
                </h3>
              </div>
              <p className="text-xs text-warmgray-600 dark:text-warmgray-400 max-w-xl">
                Current baseline is set to 612 days. Each calendar day in <strong>{sharedTimezone}</strong> where both Ayush and Vrishti log in, this counter increases permanently by +1.
              </p>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium flex items-center gap-3 pt-1">
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
          <div className="p-4 bg-warmgray-50/80 dark:bg-[#20182a] rounded-2xl border border-warmgray-200 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-warmgray-600 dark:text-warmgray-400" />
                <h4 className="text-xs font-bold text-warmgray-800 dark:text-warmgray-200 uppercase tracking-wider">
                  Sanctuary Secret Invite Code
                </h4>
              </div>
              <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mt-0.5">
                Use this private code to pair or sign in from a phone or second device.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <code className="px-3 py-1.5 bg-white dark:bg-[#2c223a] border border-warmgray-300 dark:border-rose-900/60 rounded-xl font-mono text-sm font-bold text-rose-700 dark:text-rose-300">
                {couple?.inviteCode || 'US-FOREVER-2024'}
              </code>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-3 py-1.5 bg-white dark:bg-[#2c223a] hover:bg-rose-50 dark:hover:bg-rose-950/60 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl transition flex items-center gap-1 shadow-2xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: General & Personal Preferences                 */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-[#191422] rounded-3xl p-6 sm:p-8 border border-rose-100 dark:border-rose-900/40 shadow-sm space-y-6 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <User className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </span>
              <div>
                <h2 className="font-serif font-bold text-lg text-warmgray-900 dark:text-warmgray-100">
                  Account & Reminders ({currentUser.name})
                </h2>
                <p className="text-xs text-warmgray-500 dark:text-warmgray-400">
                  Personal preferences specific to your account session.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-300 bg-warmgray-100 dark:bg-warmgray-800 px-2.5 py-1 rounded-full">
              Personal
            </span>
          </div>

          {/* Persona Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-rose-200 dark:border-rose-800 shadow-xs"
              />
              <div>
                <span className="font-serif font-bold text-sm text-warmgray-900 dark:text-warmgray-100 block">
                  {currentUser.name}
                </span>
                <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
                  {isPartner1Active ? 'Partner 1 (Creator)' : 'Partner 2 (Partner)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToProfile && (
                <button
                  type="button"
                  onClick={onNavigateToProfile}
                  className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-[#251d30] border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
                >
                  Edit My Profile & Photo
                </button>
              )}
              <button
                type="button"
                onClick={switchActiveUser}
                className="px-3.5 py-1.5 text-xs font-semibold text-warmgray-700 dark:text-warmgray-200 bg-white dark:bg-[#251d30] border border-warmgray-200 dark:border-rose-900/40 hover:bg-warmgray-50 dark:hover:bg-warmgray-800 rounded-xl transition flex items-center gap-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Switch to {partner.name}</span>
              </button>
            </div>
          </div>

          {/* Appearance & Sanctuary Theme Toggle */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-wider flex items-center gap-1.5">
              {isDark ? <Moon className="w-3.5 h-3.5 text-rose-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>Appearance & Sanctuary Theme</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Light Mode Selection */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  !isDark
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 ring-2 ring-rose-200 dark:ring-rose-900 shadow-sm'
                    : 'bg-warmgray-50/60 dark:bg-[#221a2c] border-warmgray-200 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-sm text-warmgray-900 dark:text-warmgray-100 block">
                      Light Mode
                    </span>
                    <span className="text-[11px] text-warmgray-500 dark:text-warmgray-400">
                      Warm romantic daylight & rose tones
                    </span>
                  </div>
                </div>
                {!isDark && (
                  <span className="p-1.5 bg-rose-600 text-white rounded-full">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>

              {/* Dark Mode Selection */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  isDark
                    ? 'bg-rose-950/50 border-rose-600 ring-2 ring-rose-800 shadow-sm'
                    : 'bg-warmgray-50/60 dark:bg-[#221a2c] border-warmgray-200 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/50 text-rose-300 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-rose-300" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-sm text-warmgray-900 dark:text-warmgray-100 block">
                      Dark Mode
                    </span>
                    <span className="text-[11px] text-warmgray-500 dark:text-warmgray-400">
                      Cozy midnight starlight & nocturnal sanctuary
                    </span>
                  </div>
                </div>
                {isDark && (
                  <span className="p-1.5 bg-rose-600 text-white rounded-full">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            </div>
            <p className="text-[11px] text-warmgray-500 dark:text-warmgray-400">
              Personal preference: Ayush and Vrishti each have their own independent theme preference saved across visits.
            </p>
          </div>

          {/* Optional Reminders & Notifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-rose-500" />
              <span>Reminders & Notifications</span>
            </h3>

            {/* Daily Check-in Reminder */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/30 bg-warmgray-50/40 dark:bg-[#20182a] hover:bg-warmgray-50 dark:hover:bg-[#261d32] cursor-pointer transition">
              <div>
                <span className="font-semibold text-xs sm:text-sm text-warmgray-900 dark:text-warmgray-100 block">
                  Daily Check-in Reminder
                </span>
                <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
                  Gentle banner alert when today&apos;s Love Day count is waiting for your check-in.
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderDailyCheckin}
                onChange={(e) => setReminderDailyCheckin(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400 dark:bg-warmgray-900 dark:border-rose-800"
              />
            </label>

            {/* Date Night & Anniversary Reminder */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/30 bg-warmgray-50/40 dark:bg-[#20182a] hover:bg-warmgray-50 dark:hover:bg-[#261d32] cursor-pointer transition">
              <div>
                <span className="font-semibold text-xs sm:text-sm text-warmgray-900 dark:text-warmgray-100 block">
                  Anniversary & Date Night Milestones
                </span>
                <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
                  Special celebration badges on monthly anniversaries and key relationship dates.
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderDateNight}
                onChange={(e) => setReminderDateNight(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400 dark:bg-warmgray-900 dark:border-rose-800"
              />
            </label>

            {/* Interactive Sound Effects */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/30 bg-warmgray-50/40 dark:bg-[#20182a] hover:bg-warmgray-50 dark:hover:bg-[#261d32] cursor-pointer transition">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-xs sm:text-sm text-warmgray-900 dark:text-warmgray-100 block">
                    Interactive Confetti & Sound Effects
                  </span>
                  <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
                    Play celebratory heart confetti when saving milestones or winning co-op games.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400 dark:bg-warmgray-900 dark:border-rose-800"
              />
            </label>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: Privacy & Security Controls                   */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-[#191422] rounded-3xl p-6 sm:p-8 border border-rose-100 dark:border-rose-900/40 shadow-sm space-y-6 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </span>
              <div>
                <h2 className="font-serif font-bold text-lg text-warmgray-900 dark:text-warmgray-100">
                  Privacy & Storage Controls
                </h2>
                <p className="text-xs text-warmgray-500 dark:text-warmgray-400">
                  Strict row-level protection and private file storage for the two of you.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Private 2-Person
            </span>
          </div>

          <div className="space-y-3">
            {/* Private Photos Only */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/30 bg-warmgray-50/40 dark:bg-[#20182a] hover:bg-warmgray-50 dark:hover:bg-[#261d32] cursor-pointer transition">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-xs sm:text-sm text-warmgray-900 dark:text-warmgray-100 block">
                    Private Shared Gallery Only
                  </span>
                  <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
                    Ensure uploaded photos are only accessible to Ayush and Vrishti.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={privatePhotosOnly}
                onChange={(e) => setPrivatePhotosOnly(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400 dark:bg-warmgray-900 dark:border-rose-800"
              />
            </label>

            {/* Allow Downloads */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/30 bg-warmgray-50/40 dark:bg-[#20182a] hover:bg-warmgray-50 dark:hover:bg-[#261d32] cursor-pointer transition">
              <div>
                <span className="font-semibold text-xs sm:text-sm text-warmgray-900 dark:text-warmgray-100 block">
                  Allow High-Resolution Photo Downloads
                </span>
                <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
                  Enable download button in full-screen gallery viewer.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowPhotoDownloads}
                onChange={(e) => setAllowPhotoDownloads(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400 dark:bg-warmgray-900 dark:border-rose-800"
              />
            </label>
          </div>

          {/* Sanctuary Backend & ngrok Tunnel Connection */}
          <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <div>
                <strong className="text-warmgray-800 dark:text-warmgray-200 block text-sm">
                  Sanctuary Backend & ngrok Tunnel:
                </strong>
                <span className="text-warmgray-500 dark:text-warmgray-400 font-mono text-[11px] block mt-0.5">
                  Host: {getBackendUrl()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                isServerOnline
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isServerOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {isServerOnline ? 'Backend Online' : 'Offline / Check ngrok'}
              </span>

              {onOpenServerModal && (
                <button
                  type="button"
                  onClick={onOpenServerModal}
                  className="px-3 py-1 bg-white dark:bg-[#20182a] border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition"
                >
                  Configure ngrok URL
                </button>
              )}
            </div>
          </div>

          {/* Account Security: Change Password */}
          <div className="p-4 rounded-2xl border border-warmgray-200 dark:border-rose-900/30 bg-warmgray-50/40 dark:bg-[#20182a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                <span className="font-semibold text-xs sm:text-sm text-warmgray-900 dark:text-warmgray-100">
                  Account Password for {currentUser.name}
                </span>
              </div>
              <span className="text-[11px] text-warmgray-400">
                Encrypted with bcrypt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-warmgray-500 dark:text-warmgray-400 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-1.5 rounded-xl border border-warmgray-200 dark:border-rose-900/40 text-xs bg-white dark:bg-[#15111c] text-warmgray-900 dark:text-warmgray-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-warmgray-500 dark:text-warmgray-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-1.5 rounded-xl border border-warmgray-200 dark:border-rose-900/40 text-xs bg-white dark:bg-[#15111c] text-warmgray-900 dark:text-warmgray-100"
                />
              </div>
            </div>

            {passwordStatusMsg && (
              <p className={`text-[11px] font-medium ${
                passwordStatusMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {passwordStatusMsg.text}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={isChangingPassword || !currentPassword || !newPassword}
                onClick={handleChangePassword}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* Sign Out / Reset Session */}
          <div className="pt-2 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
            <span className="text-xs text-warmgray-500 dark:text-warmgray-400">
              Want to lock the screen or switch account?
            </span>
            <button
              type="button"
              onClick={() => setShowSignoutConfirm(true)}
              className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Sanctuary</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#191422] rounded-3xl p-6 max-w-sm w-full border border-rose-100 dark:border-rose-900/50 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-warmgray-900 dark:text-warmgray-100">
              Sign Out from Sanctuary?
            </h3>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-300">
              You will return to the sign-in screen. You can log back in with your password at any time.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSignoutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  setShowSignoutConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
