import React, { useState, useEffect } from 'react';
import { Share2, Smartphone, Monitor, Check, QrCode, X, Wifi, WifiOff, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SessionInviteBarProps {
  sessionId: string;
  gameTitle: string;
  isCoop?: boolean;
}

export const SessionInviteBar: React.FC<SessionInviteBarProps> = ({
  sessionId,
  gameTitle,
  isCoop = true,
}) => {
  const { currentUser, partner, couple, isPartner1Active, switchActiveUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Monitor network connection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(true);
      setTimeout(() => setIsReconnecting(false), 1500);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute invite link
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('session', sessionId);
  // Default second device to Partner 2 if current device is Partner 1
  currentUrl.searchParams.set('role', isPartner1Active ? 'partner2' : 'partner1');
  const inviteUrl = currentUrl.toString();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // QR Code URL using clean dynamic QR service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    inviteUrl
  )}&color=be123c&bgcolor=ffffff`;

  return (
    <>
      {/* Top Banner Bar inside Co-op game */}
      <div className="mb-4 p-3 bg-gradient-to-r from-rose-50/80 via-white to-champagne-50/80 dark:from-[#231b2e] dark:via-[#1e1628] dark:to-[#251a2d] border border-rose-200/70 dark:border-rose-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-2xs transition-colors">
        {/* Left: Session ID & Connection Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-[#251d30] border border-rose-200 dark:border-rose-900/40 shadow-2xs">
            {isReconnecting ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Reconnecting...
              </span>
            ) : isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Cross-Device Synced
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <WifiOff className="w-3 h-3" /> Offline (Reconnecting...)
              </span>
            )}
          </div>

          <span className="text-warmgray-500 dark:text-warmgray-400 text-[11px] hidden sm:inline">
            Session: <strong className="font-mono text-warmgray-800 dark:text-warmgray-200">{sessionId}</strong>
          </span>
        </div>

        {/* Right: Device role + Mobile invite trigger */}
        <div className="flex items-center gap-2">
          {/* Quick toggle if testing on 1 computer */}
          <button
            type="button"
            onClick={switchActiveUser}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-champagne-100/80 dark:bg-[#281e33] hover:bg-champagne-200 dark:hover:bg-[#322640] text-warmgray-700 dark:text-warmgray-300 text-[11px] font-medium border border-champagne-300 dark:border-rose-900/40 transition"
            title="Switch local player"
          >
            <span>You:</span>
            <strong className="text-rose-700 dark:text-rose-300">{currentUser.name}</strong>
          </button>

          {/* Cross-device invite button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs shadow-xs hover:shadow-rose-200 transition transform active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Join from Phone / Share</span>
          </button>
        </div>
      </div>

      {/* Disconnection Notice Toast */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>Connection temporarily interrupted. Your game progress is saved locally and will re-sync automatically upon reconnecting.</span>
          </div>
        </div>
      )}

      {/* Cross-Device Play Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in transition-colors">
          <div className="relative w-full max-w-md bg-white dark:bg-[#191422] rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-100 dark:border-rose-900/50 overflow-hidden text-center transition-colors">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-warmgray-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="font-serif font-bold text-xl text-warmgray-900 dark:text-warmgray-100">
              Play Across Phone & PC
            </h3>
            <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mt-1 max-w-xs mx-auto">
              Scan this QR code with your phone camera (or send the link to your partner) to join this exact <strong>{gameTitle}</strong> session!
            </p>

            {/* QR Code */}
            <div className="my-5 p-4 bg-rose-50/50 dark:bg-[#231a2e] rounded-2xl border border-rose-200 dark:border-rose-900/50 inline-block shadow-inner">
              <img
                src={qrCodeUrl}
                alt="QR Code to join game on phone"
                className="w-44 h-44 object-contain mx-auto rounded-xl bg-white p-2 shadow-xs"
              />
              <span className="text-[10px] text-warmgray-400 dark:text-warmgray-400 mt-2 block">
                Point iPhone or Android camera at code
              </span>
            </div>

            {/* Link box */}
            <div className="flex items-center gap-2 bg-warmgray-50 dark:bg-[#251d30] border border-warmgray-200 dark:border-rose-900/40 p-2 rounded-2xl mb-4 text-left">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="bg-transparent text-xs text-warmgray-600 dark:text-warmgray-300 flex-1 truncate px-2 outline-none font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 bg-champagne-50/70 dark:bg-[#231a2e] border border-champagne-200 dark:border-rose-900/40 rounded-2xl text-[11px] text-warmgray-600 dark:text-warmgray-300 flex items-center gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                All moves and scores synchronize in real time. If either device disconnects or refreshes, the game safely resumes right where you left off.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
