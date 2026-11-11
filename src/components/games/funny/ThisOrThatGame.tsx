import React, { useState } from 'react';
import { ArrowLeft, Check, RotateCcw, Heart, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fireHeartConfetti } from '../../common/Confetti';

interface ChoicePair {
  id: string;
  optionA: { label: string; icon: string };
  optionB: { label: string; icon: string };
}

const QUESTIONS: ChoicePair[] = [
  { id: '1', optionA: { label: 'Beach Sunset', icon: '🏖️' }, optionB: { label: 'Snowy Cabin', icon: '🏔️' } },
  { id: '2', optionA: { label: 'Midnight Snack Run', icon: '🍕' }, optionB: { label: 'Early Morning Bakery', icon: '🥐' } },
  { id: '3', optionA: { label: 'Steal the Blanket', icon: '🛌' }, optionB: { label: 'Hog All the Pillows', icon: '🛋️' } },
  { id: '4', optionA: { label: 'Cook Pasta Together', icon: '🍝' }, optionB: { label: 'Order Secret Takeout', icon: '🥡' } },
  { id: '5', optionA: { label: 'Binge Whole Season', icon: '📺' }, optionB: { label: 'One Episode a Night', icon: '⏳' } },
  { id: '6', optionA: { label: 'Rollercoaster Scream', icon: '🎢' }, optionB: { label: 'Ferris Wheel Cuddle', icon: '🎡' } },
  { id: '7', optionA: { label: 'Spontaneous Roadtrip', icon: '🚗' }, optionB: { label: 'Detailed 20-Page Plan', icon: '🗺️' } },
  { id: '8', optionA: { label: 'Goofy Dance Party', icon: '💃' }, optionB: { label: 'Slow Acoustic Sway', icon: '🎶' } },
];

export const ThisOrThatGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, partner } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B'>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentPair = QUESTIONS[currentIndex];

  const handleSelect = (choice: 'A' | 'B') => {
    const updated = { ...answers, [currentPair.id]: choice };
    setAnswers(updated);

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      fireHeartConfetti();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
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
          Question {isFinished ? QUESTIONS.length : currentIndex + 1} of {QUESTIONS.length}
        </span>
      </div>

      {isFinished ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">This or That Finished!</h2>
          <p className="text-sm text-warmgray-600">
            Great choices, {currentUser.name}! Here is your personality fingerprint:
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left py-2">
            {QUESTIONS.map((q) => {
              const ans = answers[q.id];
              const choice = ans === 'A' ? q.optionA : q.optionB;
              return (
                <div key={q.id} className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs">
                  <span className="text-xl block mb-1">{choice.icon}</span>
                  <span className="font-semibold text-warmgray-800">{choice.label}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-3">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Play Again / Switch Answers
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-warmgray-900">Couple This or That</h2>
            <p className="text-xs text-warmgray-500 mt-1">
              No thinking allowed! Trust your instant gut feeling and pick one.
            </p>
          </div>

          <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          {/* Cards Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Option A */}
            <button
              onClick={() => handleSelect('A')}
              className="p-8 rounded-3xl bg-gradient-to-br from-rose-50 to-white hover:from-rose-100/70 border-2 border-rose-200 hover:border-rose-400 text-center transition-all duration-300 transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-center gap-3 group"
            >
              <span className="text-5xl group-hover:scale-115 transition-transform">{currentPair.optionA.icon}</span>
              <span className="font-serif font-bold text-lg text-warmgray-900">{currentPair.optionA.label}</span>
              <span className="text-xs text-rose-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Select Option A
              </span>
            </button>

            {/* Option B */}
            <button
              onClick={() => handleSelect('B')}
              className="p-8 rounded-3xl bg-gradient-to-br from-champagne-50 to-white hover:from-champagne-100/70 border-2 border-amber-200 hover:border-amber-400 text-center transition-all duration-300 transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-center gap-3 group"
            >
              <span className="text-5xl group-hover:scale-115 transition-transform">{currentPair.optionB.icon}</span>
              <span className="font-serif font-bold text-lg text-warmgray-900">{currentPair.optionB.label}</span>
              <span className="text-xs text-amber-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Select Option B
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
