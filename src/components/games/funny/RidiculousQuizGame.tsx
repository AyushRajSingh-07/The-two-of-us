import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Trophy, Heart, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fireHeartConfetti } from '../../common/Confetti';

interface RidiculousQuestion {
  id: string;
  question: string;
  options: { text: string; badge: string; icon: string }[];
}

const QUESTIONS: RidiculousQuestion[] = [
  {
    id: 'rq1',
    question: 'If I magically turned into a worm tomorrow, how would you take care of me?',
    options: [
      { text: 'Build an ultra-luxurious terrarium with a tiny velvet couch', badge: 'Loyal Companion', icon: '🪱' },
      { text: 'Carry you in my hoodie pocket everywhere I go', badge: 'Velcro Sweetheart', icon: '🧥' },
      { text: 'Feed you organic gourmet soil and read bedtime stories', badge: 'Five Star Caregiver', icon: '📖' },
      { text: 'Ask if the worm can still do the laundry', badge: 'Chaotic Realist', icon: '🧺' },
    ],
  },
  {
    id: 'rq2',
    question: 'If a zombie apocalypse breaks out tonight, what is your assigned survival role?',
    options: [
      { text: 'Scout leader fighting zombies with a frying pan', badge: 'Action Hero', icon: '🍳' },
      { text: 'The strategist who hoards snacks and cozy blankets in the base', badge: 'Bunker Cozy King', icon: '🍿' },
      { text: 'The moral support giving motivational pep talks', badge: 'Cheerleader', icon: '📣' },
      { text: 'The one who befriends a zombie dog accidentally', badge: 'Animal Whisperer', icon: '🐕' },
    ],
  },
  {
    id: 'rq3',
    question: 'We have to enter a global talent show in 10 minutes with zero rehearsal. What is our act?',
    options: [
      { text: 'Dramatic synchronized karaoke to our favorite 2000s song', badge: 'Pop Star Duo', icon: '🎤' },
      { text: 'A completely improvised interpretative dance about doing dishes', badge: 'Avant-Garde Artists', icon: '🩰' },
      { text: 'Stand-up comedy roasting each other\'s weird habits', badge: 'Comedy Legends', icon: '🎭' },
      { text: 'A mind-reading illusion where we just stare at each other', badge: 'Telepathic Soulmates', icon: '🔮' },
    ],
  },
  {
    id: 'rq4',
    question: 'If we found an unexpected \$10,000 on the sidewalk, what ridiculous thing are we buying first?',
    options: [
      { text: 'A commercial soft-serve ice cream machine for the kitchen', badge: 'Dessert Royalty', icon: '🍦' },
      { text: 'Matching oversized silk animal onesies and 100 pillows', badge: 'Cozy Overlords', icon: '🧸' },
      { text: 'First-class flights to the nearest beach for 48 hours', badge: 'Spontaneous Adventurer', icon: '✈️' },
      { text: 'A private petting zoo visit with baby otters and capybaras', badge: 'Capybara Enthusiast', icon: '🦦' },
    ],
  },
];

export const RidiculousQuizGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosenOptions, setChosenOptions] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = QUESTIONS[currentIndex];

  const handleSelect = (option: any) => {
    const updated = [...chosenOptions, option];
    setChosenOptions(updated);

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      fireHeartConfetti();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setChosenOptions([]);
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
          Dilemma {isFinished ? QUESTIONS.length : currentIndex + 1} of {QUESTIONS.length}
        </span>
      </div>

      {isFinished ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="inline-block px-3.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">
            Your Couple Personality Result
          </span>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">
            Certified "Chaos & Cuddles" Duo! 💕
          </h2>
          <p className="text-sm text-warmgray-600 max-w-md mx-auto">
            {currentUser.name}, your choices prove you balance ridiculous humor with unconditional sweetness.
          </p>

          <div className="space-y-2 max-w-md mx-auto text-left py-2">
            {chosenOptions.map((opt, i) => (
              <div key={i} className="p-3 bg-champagne-50/70 border border-champagne-200 rounded-xl text-xs flex items-center gap-3">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <span className="font-bold text-rose-800">{opt.badge}: </span>
                  <span className="text-warmgray-700">{opt.text}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Take Quiz Again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-warmgray-900">The Ridiculous Quiz</h2>
            <p className="text-xs text-warmgray-500 mt-1">
              Deep existential couple questions that truly matter.
            </p>
          </div>

          <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <div className="py-2">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-warmgray-900 text-center">
              "{currentQ.question}"
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(opt)}
                className="p-4 rounded-2xl border border-warmgray-200 hover:border-rose-400 bg-white hover:bg-rose-50/40 text-left text-xs sm:text-sm text-warmgray-800 transition-all flex items-start gap-3 shadow-xs hover:shadow-md transform hover:-translate-y-0.5"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                <div>
                  <span className="font-semibold block mb-0.5 text-warmgray-900">{opt.text}</span>
                  <span className="text-[10px] text-rose-600 font-bold uppercase">{opt.badge}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
