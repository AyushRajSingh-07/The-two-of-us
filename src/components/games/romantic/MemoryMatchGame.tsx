import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Heart, Trophy, Timer, Sparkles } from 'lucide-react';
import { fireHeartConfetti } from '../../common/Confetti';

interface CardItem {
  id: number;
  pairId: number;
  label: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MEMORY_PAIRS = [
  { pairId: 1, label: 'First Date Coffee', icon: '☕' },
  { pairId: 2, label: 'Sunset Stargazing', icon: '✨' },
  { pairId: 3, label: 'Our Road Trips', icon: '🚗' },
  { pairId: 4, label: 'Homemade Pasta', icon: '🍝' },
  { pairId: 5, label: 'Midnight Ice Cream', icon: '🍦' },
  { pairId: 6, label: 'Cuddle & Movies', icon: '🍿' },
  { pairId: 7, label: 'Beach Sunset Walk', icon: '🌅' },
  { pairId: 8, label: 'Our Special Song', icon: '🎵' },
];

export const MemoryMatchGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // Initialize and shuffle deck
  const initGame = () => {
    const deck: CardItem[] = [];
    MEMORY_PAIRS.forEach((item, idx) => {
      deck.push({
        id: idx * 2,
        pairId: item.pairId,
        label: item.label,
        icon: item.icon,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: idx * 2 + 1,
        pairId: item.pairId,
        label: item.label,
        icon: item.icon,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIds([]);
    setMoves(0);
    setMatchesCount(0);
    setSeconds(0);
    setIsActive(true);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && !isWon) {
      timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, isWon]);

  const handleCardClick = (id: number) => {
    if (flippedIds.length === 2) return;

    const target = cards.find((c) => c.id === id);
    if (!target || target.isFlipped || target.isMatched) return;

    const newCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    const newFlipped = [...flippedIds, id];

    setCards(newCards);
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newFlipped;
      const c1 = newCards.find((c) => c.id === firstId);
      const c2 = newCards.find((c) => c.id === secondId);

      if (c1 && c2 && c1.pairId === c2.pairId) {
        // Matched!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c))
          );
          setFlippedIds([]);
          setMatchesCount((prev) => {
            const next = prev + 1;
            if (next === MEMORY_PAIRS.length) {
              setIsWon(true);
              fireHeartConfetti();
            }
            return next;
          });
        }, 500);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c))
          );
          setFlippedIds([]);
        }, 1000);
      }
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-[#191422] rounded-3xl p-6 md:p-8 border border-rose-100 dark:border-rose-900/40 shadow-xl text-warmgray-900 dark:text-warmgray-100 animate-fade-in transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-900/40 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </button>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1 text-warmgray-600 dark:text-warmgray-300">
            <Timer className="w-3.5 h-3.5 text-rose-500" /> {formatTimer(seconds)}
          </span>
          <span className="flex items-center gap-1 text-warmgray-600 dark:text-warmgray-300">
            Moves: <strong className="text-rose-600 dark:text-rose-400">{moves}</strong>
          </span>
          <button
            onClick={initGame}
            className="flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restart
          </button>
        </div>
      </div>

      {isWon ? (
        <div className="text-center py-10 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">All Memories Matched! 💕</h2>
          <p className="text-sm text-warmgray-600">
            You solved the memory match in <strong>{moves} moves</strong> and <strong>{formatTimer(seconds)}</strong>!
          </p>
          <div className="pt-3">
            <button
              onClick={initGame}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Play Again
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-center mb-5">
            <h2 className="text-xl font-serif font-bold text-warmgray-900">Our Memory Match</h2>
            <p className="text-xs text-warmgray-500 mt-1">
              Flip the cards to match our shared memories and date milestones!
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {cards.map((c) => {
              const showFace = c.isFlipped || c.isMatched;
              return (
                <div
                  key={c.id}
                  onClick={() => handleCardClick(c.id)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all duration-300 transform select-none ${
                    showFace
                      ? c.isMatched
                        ? 'bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-xs'
                        : 'bg-white border-2 border-rose-400 text-warmgray-900 shadow-md scale-102'
                      : 'bg-gradient-to-br from-rose-400 to-rose-500 text-white hover:opacity-90 shadow-sm'
                  }`}
                >
                  {showFace ? (
                    <div className="animate-fade-in flex flex-col items-center">
                      <span className="text-2xl sm:text-3xl mb-1">{c.icon}</span>
                      <span className="text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2">
                        {c.label}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-rose-200">
                      <Heart className="w-5 h-5 fill-rose-300/40" />
                      <Sparkles className="w-3 h-3 text-rose-200 mt-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
