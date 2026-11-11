import React, { useState } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown, CheckCircle2, RotateCcw, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { fireHeartConfetti } from '../../common/Confetti';

interface Milestone {
  id: string;
  order: number; // Correct chronological index (1 to N)
  title: string;
  dateStr: string;
  description: string;
  icon: string;
}

const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'm1',
    order: 1,
    title: 'The First "Hello"',
    dateStr: 'First Chapter',
    description: 'When we first exchanged messages and the conversation flowed effortlessly until 3 AM.',
    icon: '💌',
  },
  {
    id: 'm2',
    order: 2,
    title: 'Our First Official Date',
    dateStr: 'First Date',
    description: 'Butterflies in our stomachs, nervous smiles, and an unforgettable evening together.',
    icon: '☕',
  },
  {
    id: 'm3',
    order: 3,
    title: 'First Time Saying "I Love You"',
    dateStr: 'Three Words',
    description: 'A whisper in the quiet evening that made time completely stand still.',
    icon: '💖',
  },
  {
    id: 'm4',
    order: 4,
    title: 'Our Very First Road Trip',
    dateStr: 'On The Road',
    description: 'Singing every lyric with the windows down and stopping for snacks at every roadside spot.',
    icon: '🚗',
  },
  {
    id: 'm5',
    order: 5,
    title: 'Cooking Our First Big Dinner',
    dateStr: 'Kitchen Chaos',
    description: 'Flour everywhere, laughing so hard our stomachs hurt, and the pasta still tasted amazing.',
    icon: '🍝',
  },
  {
    id: 'm6',
    order: 6,
    title: 'Building Our Private Sanctuary',
    dateStr: 'Today & Always',
    description: 'Creating this special space for just the two of us to cherish forever.',
    icon: '🏡',
  },
];

// Helper to shuffle
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const StoryTimelineGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [items, setItems] = useState<Milestone[]>(() => shuffle(INITIAL_MILESTONES));
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    setHasChecked(false);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setItems(newItems);
    setHasChecked(false);
  };

  const handleCheck = () => {
    const correct = items.every((item, idx) => item.order === idx + 1);
    setHasChecked(true);
    setIsCorrect(correct);
    if (correct) {
      fireHeartConfetti();
    }
  };

  const handleReset = () => {
    setItems(shuffle(INITIAL_MILESTONES));
    setHasChecked(false);
    setIsCorrect(false);
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
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reshuffle
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-warmgray-900">Our Story Timeline</h2>
        <p className="text-xs text-warmgray-500 mt-1 max-w-md mx-auto">
          Can you arrange our relationship milestones into the exact chronological order from first to latest?
        </p>
      </div>

      {hasChecked && (
        <div
          className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm animate-fade-in ${
            isCorrect
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Perfect Timeline! 💕 </span>
                <span>You remember every single step of our love story in perfect order.</span>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Not quite right yet! </span>
                <span>Some milestones are out of place. Check the highlighted cards below and try adjusting them.</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Timeline items list */}
      <div className="space-y-3 relative">
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-rose-200 -z-0 hidden sm:block" />

        {items.map((item, idx) => {
          const isItemCorrect = item.order === idx + 1;

          return (
            <div
              key={item.id}
              className={`relative z-10 flex items-center justify-between p-4 rounded-2xl border transition-all ${
                hasChecked
                  ? isItemCorrect
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-rose-50/70 border-rose-300'
                  : 'bg-white hover:bg-rose-50/30 border-warmgray-200'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-serif font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
                  {idx + 1}
                </span>
                <span className="text-2xl sm:text-3xl">{item.icon}</span>
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-sm text-warmgray-900">{item.title}</h3>
                    <span className="text-[10px] text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-full font-medium">
                      {item.dateStr}
                    </span>
                  </div>
                  <p className="text-xs text-warmgray-600 mt-0.5">{item.description}</p>
                </div>
              </div>

              {/* Up / Down Reordering Buttons */}
              <div className="flex flex-col gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="p-1 rounded-lg bg-warmgray-100 hover:bg-rose-100 disabled:opacity-20 text-warmgray-700 transition"
                  title="Move Up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === items.length - 1}
                  className="p-1 rounded-lg bg-warmgray-100 hover:bg-rose-100 disabled:opacity-20 text-warmgray-700 transition"
                  title="Move Down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center pt-6 mt-6 border-t border-rose-100">
        <button
          onClick={handleCheck}
          className="flex items-center gap-2 px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-2xl shadow-md hover:shadow-rose-200 transition transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Check Timeline</span>
        </button>
      </div>
    </div>
  );
};
