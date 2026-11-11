import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Plus, Trophy, Heart } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fireHeartConfetti } from '../../common/Confetti';

interface RoundItem {
  id: string;
  author: string;
  statements: string[];
  lieIndex: number; // 0, 1, or 2
  explanation: string;
}

const DEFAULT_ROUNDS: RoundItem[] = [
  {
    id: 'r1',
    author: 'Childhood Secrets',
    statements: [
      'I once accidentally set off a fire alarm at school by opening an emergency exit.',
      'I had a pet frog named Sir Hopsalot for two whole years.',
      'I was cast as the lead role in my middle school musical production of Annie.',
    ],
    lieIndex: 2,
    explanation: 'I auditioned for Annie but was actually cast as "Tree #3" with zero speaking lines!',
  },
  {
    id: 'r2',
    author: 'Travel & Food Misadventures',
    statements: [
      'I once ate an entire family-size tub of ice cream in under 15 minutes on a dare.',
      'I got locked inside a public train station bathroom in another country for an hour.',
      'I accidentally drank sparkling water through my nose while laughing at a meme.',
    ],
    lieIndex: 1,
    explanation: 'It was actually 20 minutes, not an hour, but it felt like eternity!',
  },
  {
    id: 'r3',
    author: 'Couple Quirk Confessions',
    statements: [
      'I practiced what I was going to wear on our first date three days in advance.',
      'I secretly keep a list of your favorite snacks in my phone notes so I never forget them.',
      'I never check the mirror before leaving the house when we go on dates.',
    ],
    lieIndex: 2,
    explanation: 'I check the mirror at least four times before walking out the door!',
  },
];

export const TwoTruthsGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, partner } = useAuth();
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Custom round creator state
  const [isCreating, setIsCreating] = useState(false);
  const [truth1, setTruth1] = useState('');
  const [truth2, setTruth2] = useState('');
  const [lie, setLie] = useState('');
  const [lieExpl, setLieExpl] = useState('');

  const currentRound = rounds[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIndex(idx);
    setIsAnswered(true);

    if (idx === currentRound.lieIndex) {
      setScore((s) => s + 1);
      fireHeartConfetti();
    }
  };

  const handleNext = () => {
    if (currentIndex < rounds.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      fireHeartConfetti();
    }
  };

  const handleCreateRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truth1.trim() || !truth2.trim() || !lie.trim()) return;

    // Randomize lie placement among 0, 1, 2
    const liePlacement = Math.floor(Math.random() * 3);
    const statements = ['', '', ''];
    const truths = [truth1.trim(), truth2.trim()];
    let truthIdx = 0;

    for (let i = 0; i < 3; i++) {
      if (i === liePlacement) {
        statements[i] = lie.trim();
      } else {
        statements[i] = truths[truthIdx++];
      }
    }

    const newRound: RoundItem = {
      id: 'round-' + Date.now(),
      author: currentUser.name,
      statements,
      lieIndex: liePlacement,
      explanation: lieExpl.trim() || 'You spotted the lie!',
    };

    setRounds([...rounds, newRound]);
    setIsCreating(false);
    setTruth1('');
    setTruth2('');
    setLie('');
    setLieExpl('');
    fireHeartConfetti();
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-xl animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-warmgray-500 hover:text-rose-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </button>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isCreating ? 'Close Creator' : 'Create a Round for Partner'}</span>
        </button>
      </div>

      {isCreating ? (
        <div className="space-y-4">
          <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-200">
            <h3 className="text-base font-serif font-bold text-rose-900 mb-2">
              Create "Two Truths and a Lie" for {partner.name}
            </h3>
            <p className="text-xs text-warmgray-600 mb-4">
              Write 2 true facts about yourself and 1 convincing lie. The game will automatically shuffle them!
            </p>

            <form onSubmit={handleCreateRound} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">Truth #1</label>
                <input
                  type="text"
                  value={truth1}
                  onChange={(e) => setTruth1(e.target.value)}
                  placeholder="Something true about your life/past..."
                  className="w-full px-3.5 py-2 text-xs border border-emerald-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">Truth #2</label>
                <input
                  type="text"
                  value={truth2}
                  onChange={(e) => setTruth2(e.target.value)}
                  placeholder="Another real fact about you..."
                  className="w-full px-3.5 py-2 text-xs border border-emerald-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">The Lie (Made up!)</label>
                <input
                  type="text"
                  value={lie}
                  onChange={(e) => setLie(e.target.value)}
                  placeholder="A convincing lie that might fool your partner..."
                  className="w-full px-3.5 py-2 text-xs border border-rose-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">The Truth Behind the Lie</label>
                <input
                  type="text"
                  value={lieExpl}
                  onChange={(e) => setLieExpl(e.target.value)}
                  placeholder="Explanation revealed when your partner guesses..."
                  className="w-full px-3.5 py-2 text-xs border border-warmgray-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
                >
                  Save & Add Round!
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : isFinished ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">Game Complete!</h2>
          <p className="text-sm text-warmgray-600">
            You caught <strong className="text-rose-600 text-lg">{score}</strong> out of{' '}
            <strong className="text-rose-600 text-lg">{rounds.length}</strong> lies!
          </p>
          <div className="pt-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedIndex(null);
                setIsAnswered(false);
                setScore(0);
                setIsFinished(false);
              }}
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
              Round {currentIndex + 1} of {rounds.length} • By {currentRound.author}
            </span>
            <h2 className="text-2xl font-serif font-bold text-warmgray-900 mt-2">Two Truths and a Lie</h2>
            <p className="text-xs text-warmgray-500 mt-0.5">
              Two of these statements are 100% true. Which one is the lie? Click to guess!
            </p>
          </div>

          {/* Statements */}
          <div className="space-y-3 pt-2">
            {currentRound.statements.map((stmt, idx) => {
              const isSelected = selectedIndex === idx;
              const isLie = idx === currentRound.lieIndex;
              let btnClass = 'border-warmgray-200 hover:border-rose-300 bg-white hover:bg-rose-50/30 text-warmgray-800';

              if (isAnswered) {
                if (isLie) {
                  btnClass = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                } else if (isSelected) {
                  btnClass = 'border-amber-400 bg-amber-50 text-amber-900';
                } else {
                  btnClass = 'opacity-60 border-warmgray-200 bg-warmgray-50';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between shadow-xs ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{stmt}</span>
                  </div>

                  {isAnswered && (
                    isLie ? (
                      <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                        THE LIE! 🎯
                      </span>
                    ) : isSelected ? (
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-semibold rounded-full flex-shrink-0">
                        That was true!
                      </span>
                    ) : null
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation reveal */}
          {isAnswered && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 animate-fade-in">
              <span className="font-bold">Story Reveal: </span>
              <span>{currentRound.explanation}</span>
            </div>
          )}

          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                {currentIndex < rounds.length - 1 ? 'Next Round →' : 'See Results! ✨'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
