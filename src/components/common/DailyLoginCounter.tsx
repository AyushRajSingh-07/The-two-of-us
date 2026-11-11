import React from 'react';
import { Calendar, CheckCircle2, Clock, Sparkles, Heart, Users, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatKolkataTime } from '../../lib/utils';
import { fireHeartConfetti } from './Confetti';

export const DailyLoginCounter: React.FC = () => {
  const { couple, currentUser, partner, isPartner1Active, dailyCounter, triggerCheckin } = useAuth();
  const todayRecord = dailyCounter.todayRecord;

  // Partner 1 is Ayush, Partner 2 is Vrishti
  const p1Name = couple?.partner1Name || 'Ayush';
  const p2Name = couple?.partner2Name || 'Vrishti';

  const ayushChecked = todayRecord.partner1CheckedIn;
  const vrishtiChecked = todayRecord.partner2CheckedIn;
  const bothCompleted = todayRecord.bothCompleted;

  const handleManualCheckin = async () => {
    await triggerCheckin();
    fireHeartConfetti();
  };

  return (
    <div className="bg-gradient-to-br from-white via-rose-50/40 to-champagne-50/60 rounded-3xl p-5 sm:p-6 border border-rose-200/80 shadow-sm relative overflow-hidden transition-all">
      {/* Glow accent */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-200/40 rounded-full blur-2xl -z-0 pointer-events-none" />

      {/* Header with Cumulative Counter */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-rose-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs">
            <Calendar className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-warmgray-900">
                Shared Daily Login Counter
              </h3>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                Asia/Kolkata
              </span>
            </div>
            <p className="text-xs text-warmgray-500">
              Today: <strong className="font-medium text-warmgray-700">{dailyCounter.todayDate}</strong> • Increases by 1 only when both log in
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl shadow-sm self-stretch sm:self-auto justify-center">
          <Sparkles className="w-4 h-4 text-rose-200" />
          <div className="text-center sm:text-right">
            <span className="block text-base sm:text-lg font-serif font-bold leading-none">
              {dailyCounter.sharedCount} {dailyCounter.sharedCount === 1 ? 'Day' : 'Days'}
            </span>
            <span className="text-[10px] text-rose-100 uppercase tracking-wider font-medium">
              Both Logged In
            </span>
          </div>
        </div>
      </div>

      {/* Today's Individual Check-in Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 relative z-10">
        {/* Ayush's Check-in Card */}
        <div
          className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
            ayushChecked
              ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
              : 'bg-white/80 border-warmgray-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={couple?.partner1Avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={p1Name}
              className="w-10 h-10 rounded-full object-cover border-2 border-rose-200"
            />
            <div>
              <span className="font-serif font-bold text-sm text-warmgray-900 block">
                {p1Name}
              </span>
              <span className="text-[11px] text-warmgray-500">
                {ayushChecked
                  ? `Checked in at ${formatKolkataTime(todayRecord.partner1CheckedInAt)} IST`
                  : 'Waiting for login today'}
              </span>
            </div>
          </div>

          <div>
            {ayushChecked ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Checked In</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending</span>
              </span>
            )}
          </div>
        </div>

        {/* Vrishti's Check-in Card */}
        <div
          className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
            vrishtiChecked
              ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
              : 'bg-white/80 border-warmgray-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={couple?.partner2Avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={p2Name}
              className="w-10 h-10 rounded-full object-cover border-2 border-rose-200"
            />
            <div>
              <span className="font-serif font-bold text-sm text-warmgray-900 block">
                {p2Name}
              </span>
              <span className="text-[11px] text-warmgray-500">
                {vrishtiChecked
                  ? `Checked in at ${formatKolkataTime(todayRecord.partner2CheckedInAt)} IST`
                  : 'Waiting for login today'}
              </span>
            </div>
          </div>

          <div>
            {vrishtiChecked ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Checked In</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Status Message & Waiting Alert */}
      <div className="relative z-10 pt-2 border-t border-rose-100/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="text-xs">
          {bothCompleted ? (
            <p className="text-emerald-800 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Both {p1Name} and {p2Name} have checked in today! Shared counter increased by 1 💕
              </span>
            </p>
          ) : ayushChecked && !vrishtiChecked ? (
            <p className="text-amber-800 font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                {p1Name} is logged in! Waiting for {p2Name} to log in to increase the shared counter.
              </span>
            </p>
          ) : !ayushChecked && vrishtiChecked ? (
            <p className="text-amber-800 font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                {p2Name} is logged in! Waiting for {p1Name} to log in to increase the shared counter.
              </span>
            </p>
          ) : (
            <p className="text-warmgray-500 font-medium flex items-center gap-1.5">
              <Users className="w-4 h-4 text-warmgray-400 flex-shrink-0" />
              <span>
                Waiting for both {p1Name} and {p2Name} to log in today.
              </span>
            </p>
          )}
        </div>

        {/* Interactive Check-in Button if current user is not marked */}
        {((isPartner1Active && !ayushChecked) || (!isPartner1Active && !vrishtiChecked)) && (
          <button
            type="button"
            onClick={handleManualCheckin}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition transform active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Check In as {currentUser.name}</span>
          </button>
        )}
      </div>
    </div>
  );
};
