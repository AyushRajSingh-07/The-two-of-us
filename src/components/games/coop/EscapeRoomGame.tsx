import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Unlock, Key, BookOpen, Music, Search, Heart, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { DataStore } from '../../../lib/store';
import { fireHeartConfetti } from '../../common/Confetti';
import { SessionInviteBar } from '../../common/SessionInviteBar';

interface EscapeState {
  foundKey: boolean;
  bookshelfSolved: boolean;
  musicBoxPlayed: boolean;
  deskInspected: boolean;
  boxUnlocked: boolean;
  clues: string[];
}

const INITIAL_STATE: EscapeState = {
  foundKey: false,
  bookshelfSolved: false,
  musicBoxPlayed: false,
  deskInspected: false,
  boxUnlocked: false,
  clues: [],
};

const MASTER_CODE = '2024';

export const EscapeRoomGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, partner, couple } = useAuth();
  const sessionId = `${couple?.id || 'default'}_escape_room`;

  const [state, setState] = useState<EscapeState>(INITIAL_STATE);
  const [selectedStation, setSelectedStation] = useState<'room' | 'desk' | 'bookshelf' | 'musicbox' | 'lockbox'>('room');
  const [codeAttempt, setCodeAttempt] = useState('');
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    DataStore.getGameSession<EscapeState>(sessionId).then((s) => {
      if (s?.data) setState(s.data);
    });

    const unsub = DataStore.onSync((e) => {
      if (e.type === 'GAME_UPDATED' && e.payload?.gameId === 'escape_room') {
        setState(e.payload.data);
      }
    });
    return unsub;
  }, [sessionId]);

  const updateState = (newState: EscapeState) => {
    setState(newState);
    DataStore.updateGameSession({
      sessionId,
      gameId: 'escape_room',
      status: newState.boxUnlocked ? 'completed' : 'in_progress',
      data: newState,
      lastUpdatedBy: currentUser.id,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeAttempt.trim() === MASTER_CODE) {
      fireHeartConfetti();
      updateState({ ...state, boxUnlocked: true });
      setCodeError(false);
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 2000);
    }
  };

  const resetGame = () => {
    updateState(INITIAL_STATE);
    setCodeAttempt('');
    setSelectedStation('room');
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-xl animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-warmgray-500 hover:text-rose-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </button>

        <button
          onClick={resetGame}
          className="flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restart Room
        </button>
      </div>

      {/* Cross-Device Session Sync & Invite Bar */}
      <SessionInviteBar sessionId={sessionId} gameTitle="Mini Escape Room" />

      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-warmgray-900">Mini Escape Room</h2>
        <p className="text-xs text-warmgray-500 mt-1 max-w-md mx-auto">
          "The Love Lockbox Mystery" — Investigate the room clues together and enter the 4-digit code to reveal the secret gift!
        </p>
      </div>

      {state.boxUnlocked ? (
        <div className="text-center py-8 space-y-4 animate-scale-up">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <Unlock className="w-10 h-10 text-rose-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">Lockbox Opened! 💕</h2>
          <div className="p-6 bg-gradient-to-br from-rose-50 to-champagne-50 border-2 border-rose-200 rounded-3xl max-w-md mx-auto text-left shadow-md">
            <p className="font-serif italic text-rose-950 text-sm leading-relaxed mb-3">
              "To my favorite person in the whole universe — every day with you is my greatest adventure. You unlocked this box, but you've had the key to my heart all along."
            </p>
            <p className="text-xs font-bold text-rose-700 text-right">Forever & Always 💖</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Station View or Room Hub */}
          {selectedStation === 'room' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Desk */}
              <button
                onClick={() => {
                  setSelectedStation('desk');
                  if (!state.deskInspected) updateState({ ...state, deskInspected: true });
                }}
                className="p-5 rounded-3xl bg-champagne-50/70 hover:bg-rose-50 border-2 border-champagne-200 hover:border-rose-300 text-center transition flex flex-col items-center gap-2 group"
              >
                <span className="text-3xl group-hover:scale-115 transition-transform">📜</span>
                <span className="font-serif font-bold text-xs text-warmgray-800">The Vintage Desk</span>
                <span className="text-[10px] text-warmgray-500">
                  {state.deskInspected ? '✓ Inspected' : 'Search clues'}
                </span>
              </button>

              {/* Bookshelf */}
              <button
                onClick={() => {
                  setSelectedStation('bookshelf');
                  if (!state.bookshelfSolved) updateState({ ...state, bookshelfSolved: true });
                }}
                className="p-5 rounded-3xl bg-champagne-50/70 hover:bg-rose-50 border-2 border-champagne-200 hover:border-rose-300 text-center transition flex flex-col items-center gap-2 group"
              >
                <span className="text-3xl group-hover:scale-115 transition-transform">📚</span>
                <span className="font-serif font-bold text-xs text-warmgray-800">The Bookshelf</span>
                <span className="text-[10px] text-warmgray-500">
                  {state.bookshelfSolved ? '✓ Inspected' : 'Read spine'}
                </span>
              </button>

              {/* Music Box */}
              <button
                onClick={() => {
                  setSelectedStation('musicbox');
                  if (!state.musicBoxPlayed) updateState({ ...state, musicBoxPlayed: true });
                }}
                className="p-5 rounded-3xl bg-champagne-50/70 hover:bg-rose-50 border-2 border-champagne-200 hover:border-rose-300 text-center transition flex flex-col items-center gap-2 group"
              >
                <span className="text-3xl group-hover:scale-115 transition-transform">🎵</span>
                <span className="font-serif font-bold text-xs text-warmgray-800">Antique Music Box</span>
                <span className="text-[10px] text-warmgray-500">
                  {state.musicBoxPlayed ? '✓ Wind up' : 'Listen'}
                </span>
              </button>

              {/* Master Lockbox */}
              <button
                onClick={() => setSelectedStation('lockbox')}
                className="p-5 rounded-3xl bg-rose-50 hover:bg-rose-100/70 border-2 border-rose-300 text-center transition flex flex-col items-center gap-2 group"
              >
                <span className="text-3xl group-hover:scale-115 transition-transform">🔐</span>
                <span className="font-serif font-bold text-xs text-rose-900">The Master Lockbox</span>
                <span className="text-[10px] text-rose-600 font-semibold">Enter 4-digit code</span>
              </button>
            </div>
          )}

          {/* Desk Detail */}
          {selectedStation === 'desk' && (
            <div className="p-6 bg-champagne-50/60 rounded-3xl border border-champagne-200 space-y-3 animate-fade-in">
              <h3 className="font-serif font-bold text-base text-warmgray-900 flex items-center gap-2">
                <span>📜</span> The Vintage Wooden Desk
              </h3>
              <p className="text-xs text-warmgray-700 leading-relaxed">
                You open the middle drawer and find a handwritten note with coffee rings:
              </p>
              <div className="p-4 bg-white rounded-2xl border border-champagne-300 text-xs font-serif italic text-warmgray-800">
                "Our story didn't start yesterday, but the year our journey began holds the first two digits of the secret combination... <strong>(20...)</strong>"
              </div>
              <button
                onClick={() => setSelectedStation('room')}
                className="text-xs font-semibold text-rose-600 underline pt-2"
              >
                ← Back to Room
              </button>
            </div>
          )}

          {/* Bookshelf Detail */}
          {selectedStation === 'bookshelf' && (
            <div className="p-6 bg-champagne-50/60 rounded-3xl border border-champagne-200 space-y-3 animate-fade-in">
              <h3 className="font-serif font-bold text-base text-warmgray-900 flex items-center gap-2">
                <span>📚</span> The Rosewood Bookshelf
              </h3>
              <p className="text-xs text-warmgray-700 leading-relaxed">
                A ribbon bookmark hangs out of a poetry collection:
              </p>
              <div className="p-4 bg-white rounded-2xl border border-champagne-300 text-xs font-serif italic text-warmgray-800">
                "Two hearts beating as one, multiplied by nothing, leaves the third digit steadfast as a calm ocean... <strong>(...2...)</strong>"
              </div>
              <button
                onClick={() => setSelectedStation('room')}
                className="text-xs font-semibold text-rose-600 underline pt-2"
              >
                ← Back to Room
              </button>
            </div>
          )}

          {/* Music Box Detail */}
          {selectedStation === 'musicbox' && (
            <div className="p-6 bg-champagne-50/60 rounded-3xl border border-champagne-200 space-y-3 animate-fade-in">
              <h3 className="font-serif font-bold text-base text-warmgray-900 flex items-center gap-2">
                <span>🎵</span> The Antique Music Box
              </h3>
              <p className="text-xs text-warmgray-700 leading-relaxed">
                You turn the golden key. It plays our favorite tune in a waltz! Under the lid, four Roman numerals are etched:
              </p>
              <div className="p-4 bg-white rounded-2xl border border-champagne-300 text-xs font-serif italic text-warmgray-800">
                "IV letters in LOVE. IV seasons of caring for each other. The final digit is <strong>(...4)</strong>"
              </div>
              <button
                onClick={() => setSelectedStation('room')}
                className="text-xs font-semibold text-rose-600 underline pt-2"
              >
                ← Back to Room
              </button>
            </div>
          )}

          {/* Lockbox Detail */}
          {selectedStation === 'lockbox' && (
            <div className="p-6 bg-rose-50/60 rounded-3xl border border-rose-200 space-y-4 animate-fade-in max-w-md mx-auto text-center">
              <div className="w-12 h-12 bg-white text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-warmgray-900">
                Enter the 4-Digit Combination
              </h3>
              <p className="text-xs text-warmgray-600">
                Combine the clues from the Desk, Bookshelf, and Music Box:
              </p>

              <form onSubmit={handleUnlockAttempt} className="space-y-3">
                <input
                  type="text"
                  maxLength={4}
                  value={codeAttempt}
                  onChange={(e) => setCodeAttempt(e.target.value)}
                  placeholder="••••"
                  className={`w-36 text-center tracking-widest text-2xl font-bold py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 ${
                    codeError ? 'border-rose-600 text-rose-600 ring-rose-300' : 'border-rose-300 focus:ring-rose-400'
                  }`}
                  autoFocus
                />
                {codeError && <p className="text-xs text-rose-600 font-semibold">Incorrect code! Re-check clues.</p>}

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStation('room')}
                    className="px-4 py-2 text-xs text-warmgray-600 hover:text-warmgray-800"
                  >
                    Back to Room
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
                  >
                    Unlock!
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
