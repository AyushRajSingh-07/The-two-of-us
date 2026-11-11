import React, { useState } from 'react';
import { Heart, Key, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fireHeartConfetti } from './Confetti';

export const PairingScreen: React.FC<{ onPaired: () => void }> = ({ onPaired }) => {
  const { couple, pairWithInviteCode } = useAuth();
  const [partnerName, setPartnerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!inviteCode.trim()) {
      setErrorMsg('Please enter your couple invite code.');
      return;
    }

    const success = await pairWithInviteCode(inviteCode.trim(), partnerName.trim());
    if (success) {
      setIsSuccess(true);
      fireHeartConfetti();
      setTimeout(() => {
        onPaired();
      }, 1000);
    } else {
      setErrorMsg('Invalid invite code! Please check with your partner.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-[#faf7f5] to-champagne-100/70 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-2xl relative overflow-hidden animate-fade-in">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-200/50 rounded-full blur-2xl -z-0" />

        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Heart className="w-8 h-8 fill-rose-500 animate-pulse" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-warmgray-900">Two of Us</h1>
          <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider mt-0.5">
            Our Private Sanctuary
          </p>
          <p className="text-xs text-warmgray-500 mt-2 max-w-xs mx-auto">
            {couple?.welcomeMessage || 'A private world crafted for just the two of us.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {isSuccess ? (
          <div className="text-center py-6 space-y-2 animate-scale-up">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-warmgray-900">Welcome Home! 💕</h3>
            <p className="text-xs text-warmgray-600">Entering our private space...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-warmgray-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-500" /> Your Name / Nickname
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. Jordan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-champagne-50/40 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warmgray-700 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-rose-500" /> Couple Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={couple?.inviteCode || 'US-FOREVER-2024'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-champagne-50/40 text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
              <span className="block text-[10px] text-warmgray-400 mt-1">
                Tip: Default demo code is <strong>{couple?.inviteCode || 'US-FOREVER-2024'}</strong>
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-rose-200 transition flex items-center justify-center gap-2 transform active:scale-98"
              >
                <span>Enter Our Sanctuary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-2">
              <span className="text-[11px] text-warmgray-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Protected & private to just the 2 of you
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
