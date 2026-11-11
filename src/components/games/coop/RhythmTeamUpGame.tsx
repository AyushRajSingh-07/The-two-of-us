import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Heart, Sparkles, Trophy, Music } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fireHeartConfetti } from '../../common/Confetti';
import { SessionInviteBar } from '../../common/SessionInviteBar';

interface NoteItem {
  id: number;
  lane: 1 | 2;
  yPercent: number; // 0 to 100
  hit: boolean;
}

export const RhythmTeamUpGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, partner, couple, isPartner1Active } = useAuth();
  const sessionId = `${couple?.id || 'default'}_rhythm_sync`;

  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [lastRating, setLastRating] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const requestRef = useRef<number | null>(null);
  const nextNoteIdRef = useRef(1);

  const startGame = () => {
    setIsPlaying(true);
    setNotes([]);
    setCombo(0);
    setScore(0);
    setLastRating(null);
    setIsFinished(false);
  };

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastSpawnTime = Date.now();
    let durationTimer = setTimeout(() => {
      setIsPlaying(false);
      setIsFinished(true);
      fireHeartConfetti();
    }, 28000); // ~28 second song session

    const loop = () => {
      const now = Date.now();
      // Spawn note every ~800ms
      if (now - lastSpawnTime > 800) {
        lastSpawnTime = now;
        const lane = Math.random() > 0.5 ? 1 : 2;
        setNotes((prev) => [
          ...prev,
          { id: nextNoteIdRef.current++, lane, yPercent: 0, hit: false },
        ]);
      }

      // Move notes down
      setNotes((prev) =>
        prev
          .map((n) => ({ ...n, yPercent: n.yPercent + 1.2 }))
          .filter((n) => n.yPercent < 105)
      );

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearTimeout(durationTimer);
    };
  }, [isPlaying]);

  const handleTap = (lane: 1 | 2) => {
    if (!isPlaying) return;

    // Find closest unhit note in this lane near target (yPercent ~ 80)
    const target = notes.find(
      (n) => n.lane === lane && !n.hit && Math.abs(n.yPercent - 80) < 18
    );

    if (target) {
      const diff = Math.abs(target.yPercent - 80);
      let rating = 'Great! ✨';
      let pts = 100;

      if (diff < 8) {
        rating = 'PERFECT! 💖';
        pts = 200;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([15, 30, 15]);
      } else {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      }

      setScore((s) => s + pts + combo * 10);
      setCombo((c) => c + 1);
      setLastRating(rating);

      // Mark hit
      setNotes((prev) =>
        prev.map((n) => (n.id === target.id ? { ...n, hit: true } : n))
      );
    } else {
      setCombo(0);
      setLastRating('Miss!');
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' || e.code === 'ArrowLeft') handleTap(1);
      if (e.code === 'KeyK' || e.code === 'ArrowRight') handleTap(2);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-[#191422] rounded-3xl p-6 md:p-8 border border-rose-100 dark:border-rose-900/40 shadow-xl text-warmgray-900 dark:text-warmgray-100 animate-fade-in transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-900/40 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <Music className="w-3.5 h-3.5" /> Score: {score} • Combo: {combo}x
          </span>
        </div>
      </div>

      {/* Cross-device Invite & Status Bar */}
      <SessionInviteBar sessionId={sessionId} gameTitle="Rhythm Team-Up" />

      <div className="text-center mb-4">
        <h2 className="text-2xl font-serif font-bold text-warmgray-900 dark:text-warmgray-100">Rhythm Team-Up</h2>
        <p className="text-xs text-warmgray-500 mt-0.5">
          Harmonize your heartbeats! Tap as the falling hearts reach the sweet spot bar.
        </p>
      </div>

      {isFinished ? (
        <div className="text-center py-10 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">Harmonious Heartbeat Complete!</h2>
          <p className="text-sm text-warmgray-600">
            Combined Team Score: <strong className="text-rose-600 text-xl">{score}</strong> points!
          </p>
          <div className="pt-3">
            <button
              onClick={startGame}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Play Another Track
            </button>
          </div>
        </div>
      ) : !isPlaying ? (
        <div className="p-8 text-center bg-champagne-50/70 border-2 border-dashed border-rose-200 rounded-3xl space-y-4">
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500 mx-auto animate-pulse" />
          <h3 className="font-serif font-bold text-lg text-warmgray-800">Ready to Coordinate?</h3>
          <p className="text-xs text-warmgray-600 max-w-sm mx-auto">
            Lane 1 (Left / 'D' key) for {currentUser.name}, Lane 2 (Right / 'K' key) for {partner.name}!
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-2xl shadow-md transition flex items-center gap-2 mx-auto"
          >
            <Play className="w-4 h-4 fill-white" /> Start Track
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* Rhythm Track Lanes */}
          <div className="relative w-72 h-80 bg-gradient-to-b from-champagne-100/60 to-rose-50/80 rounded-3xl border-2 border-rose-200 overflow-hidden shadow-inner flex">
            {/* Center divider */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-200" />

            {/* Target Judgment Line at 80% */}
            <div className="absolute left-0 right-0 top-[80%] h-1 bg-rose-400 shadow-sm z-10 flex justify-between px-3">
              <span className="text-[9px] text-rose-500 font-bold -mt-3.5">TARGET</span>
              <span className="text-[9px] text-rose-500 font-bold -mt-3.5">TARGET</span>
            </div>

            {/* Rating flash */}
            {lastRating && (
              <div className="absolute top-1/3 left-0 right-0 text-center font-bold text-sm text-rose-600 drop-shadow animate-ping z-20">
                {lastRating}
              </div>
            )}

            {/* Falling notes */}
            {notes.map(
              (n) =>
                !n.hit && (
                  <div
                    key={n.id}
                    className="absolute text-2xl transform -translate-x-1/2 select-none"
                    style={{
                      left: n.lane === 1 ? '25%' : '75%',
                      top: `${n.yPercent}%`,
                    }}
                  >
                    {n.lane === 1 ? '💖' : '⭐'}
                  </div>
                )
            )}
          </div>

          {/* Tap Buttons */}
          <div className="flex gap-6">
            <button
              onClick={() => handleTap(1)}
              className="px-6 py-4 bg-white hover:bg-rose-100 active:bg-rose-200 border-2 border-rose-300 rounded-2xl shadow-md text-xs font-bold text-rose-800 transition transform active:scale-95 flex flex-col items-center gap-1"
            >
              <span>💖 Lane 1 ({currentUser.name})</span>
              <span className="text-[10px] text-warmgray-400">Tap / 'D' Key</span>
            </button>

            <button
              onClick={() => handleTap(2)}
              className="px-6 py-4 bg-white hover:bg-amber-100 active:bg-amber-200 border-2 border-amber-300 rounded-2xl shadow-md text-xs font-bold text-amber-900 transition transform active:scale-95 flex flex-col items-center gap-1"
            >
              <span>⭐ Lane 2 ({partner.name})</span>
              <span className="text-[10px] text-warmgray-400">Tap / 'K' Key</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
