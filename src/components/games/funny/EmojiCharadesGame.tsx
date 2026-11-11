import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Lightbulb, CheckCircle2, RotateCcw, Trophy, Heart } from 'lucide-react';
import { fireHeartConfetti } from '../../common/Confetti';

interface CharadeItem {
  id: string;
  category: string;
  emojis: string;
  answers: string[]; // Variations of acceptable answers
  hint: string;
}

const CHARADES: CharadeItem[] = [
  {
    id: 'c1',
    category: 'Romantic Movie',
    emojis: '🚢 ❄️ 💎 🎨 🎻',
    answers: ['titanic'],
    hint: 'Near, far, wherever you are...',
  },
  {
    id: 'c2',
    category: 'Classic Date Night',
    emojis: '🍕 🍷 🛋️ 🍿 🎬',
    answers: ['movie night', 'netflix and chill', 'pizza and movie', 'dinner and movie'],
    hint: 'Blankets, comfy clothes, and streaming on the sofa.',
  },
  {
    id: 'c3',
    category: 'Romantic Song',
    emojis: '💃 🌌 ✨ 🎸 🎶 👗',
    answers: ['dancing in the dark', 'a sky full of stars', 'city of stars', 'perfect'],
    hint: 'Ed Sheeran dancing barefoot on the grass.',
  },
  {
    id: 'c4',
    category: 'Couple Activity',
    emojis: '🚗 📻 🗺️ 🛣️ 🌅',
    answers: ['road trip', 'roadtrip', 'scenic drive'],
    hint: 'Singing playlists with the windows rolled down.',
  },
  {
    id: 'c5',
    category: 'Animated Movie',
    emojis: '🎈 🏠 👴 👦 🐕 🌄',
    answers: ['up'],
    hint: 'Adventure is out there! (and the first 10 minutes made us cry).',
  },
];

export const EmojiCharadesGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const current = CHARADES[currentIndex];

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isAnswered) return;

    const cleaned = guess.trim().toLowerCase();
    const isCorrect = current.answers.some((ans) => cleaned.includes(ans) || ans.includes(cleaned));

    setIsAnswered(true);
    if (isCorrect) {
      setScore((s) => s + 1);
      fireHeartConfetti();
    }
  };

  const handleNext = () => {
    if (currentIndex < CHARADES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setGuess('');
      setShowHint(false);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      fireHeartConfetti();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setGuess('');
    setShowHint(false);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-[#191422] rounded-3xl p-6 md:p-8 border border-rose-100 dark:border-rose-900/40 shadow-xl text-warmgray-900 dark:text-warmgray-100 animate-fade-in transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-900/40 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-warmgray-500 dark:text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </button>

        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          Clue {currentIndex + 1} of {CHARADES.length} • Score: {score}
        </span>
      </div>

      {isFinished ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">Charades Champion!</h2>
          <p className="text-sm text-warmgray-600">
            You solved <strong className="text-rose-600 text-lg">{score}</strong> out of{' '}
            <strong className="text-rose-600 text-lg">{CHARADES.length}</strong> emoji clues!
          </p>
          <div className="pt-3">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Play Again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {current.category}
            </span>
            <h2 className="text-2xl font-serif font-bold text-warmgray-900 mt-2">Emoji Charades</h2>
            <p className="text-xs text-warmgray-500 mt-0.5">
              Decode the emoji sequence below to guess the title or activity!
            </p>
          </div>

          {/* Emoji Display Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-champagne-50 border-2 border-rose-200 text-center shadow-md">
            <span className="text-4xl sm:text-6xl tracking-widest block select-all">
              {current.emojis}
            </span>
          </div>

          {/* Hint button */}
          <div className="text-center">
            {showHint ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 inline-flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span><strong>Hint: </strong>{current.hint}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-xs text-warmgray-500 hover:text-amber-600 flex items-center justify-center gap-1 mx-auto"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Need a gentle hint?
              </button>
            )}
          </div>

          {/* Answer Status or Input */}
          {isAnswered ? (
            <div className="space-y-4 text-center animate-fade-in">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                <p className="text-xs text-warmgray-500">Correct Answer:</p>
                <p className="text-lg font-serif font-bold text-rose-700 capitalize">
                  {current.answers[0]}
                </p>
              </div>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                {currentIndex < CHARADES.length - 1 ? 'Next Emoji Clue →' : 'See Final Score ✨'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleGuess} className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Type your guess here..."
                className="flex-1 px-4 py-3 bg-champagne-50/40 border border-rose-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                autoFocus
              />
              <button
                type="submit"
                disabled={!guess.trim()}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-semibold text-xs rounded-2xl shadow-md transition"
              >
                Guess!
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
