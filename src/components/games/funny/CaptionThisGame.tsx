import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Send, Heart, Trophy, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fireHeartConfetti } from '../../common/Confetti';

interface Scenario {
  id: string;
  image: string;
  prompt: string;
  starterCaptions: { user: string; text: string; votes: number }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80',
    prompt: 'When he says "We don\'t need GPS, I know a shortcut":',
    starterCaptions: [
      { user: 'Partner 2', text: '3 hours later in an empty cornfield staring at sheep...', votes: 3 },
      { user: 'Partner 1', text: 'The scenic route has character okay?!', votes: 2 },
    ],
  },
  {
    id: 's2',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
    prompt: 'Me watching you eat the last leftover slice of pizza we agreed to split:',
    starterCaptions: [
      { user: 'Partner 1', text: 'Top 10 anime betrayals in real life', votes: 4 },
      { user: 'Partner 2', text: 'You took too long to blink, legally it became mine', votes: 5 },
    ],
  },
  {
    id: 's3',
    image: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=800&auto=format&fit=crop&q=80',
    prompt: 'When you ask "What do you want to eat for dinner?" and I say "I don\'t mind, anything":',
    starterCaptions: [
      { user: 'Partner 2', text: '*proceeds to reject the next 9 options in a row*', votes: 6 },
    ],
  },
];

export const CaptionThisGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, partner } = useAuth();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [captionsList, setCaptionsList] = useState(SCENARIOS);
  const [newCaption, setNewCaption] = useState('');

  const currentScenario = captionsList[scenarioIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim()) return;

    const updated = [...captionsList];
    updated[scenarioIndex].starterCaptions.push({
      user: currentUser.name,
      text: newCaption.trim(),
      votes: 1,
    });
    setCaptionsList(updated);
    setNewCaption('');
    fireHeartConfetti();
  };

  const handleVote = (capIndex: number) => {
    const updated = [...captionsList];
    updated[scenarioIndex].starterCaptions[capIndex].votes += 1;
    setCaptionsList(updated);
    fireHeartConfetti();
  };

  const nextScenario = () => {
    setScenarioIndex((prev) => (prev + 1) % captionsList.length);
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

        <button
          onClick={nextScenario}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Next Photo ({scenarioIndex + 1}/{captionsList.length})</span>
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-warmgray-900">Caption This!</h2>
        <p className="text-xs text-warmgray-500 mt-1 max-w-md mx-auto">
          Write the funniest caption for this photo or vote on your partner's best roast!
        </p>
      </div>

      {/* Scenario Card */}
      <div className="space-y-4">
        <div className="rounded-3xl overflow-hidden border border-warmgray-200 shadow-md bg-warmgray-50">
          <img
            src={currentScenario.image}
            alt="Scenario"
            className="w-full max-h-72 object-cover"
          />
          <div className="p-4 bg-white border-t border-warmgray-100">
            <h3 className="font-serif font-bold text-base sm:text-lg text-warmgray-900">
              "{currentScenario.prompt}"
            </h3>
          </div>
        </div>

        {/* Existing captions list */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-warmgray-700 uppercase tracking-wider">
            Captions on the Board:
          </h4>
          {currentScenario.starterCaptions.map((cap, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-champagne-50/60 rounded-2xl border border-champagne-200 text-xs sm:text-sm"
            >
              <div>
                <span className="font-bold text-rose-700 mr-2">{cap.user}:</span>
                <span className="text-warmgray-800 italic">"{cap.text}"</span>
              </div>
              <button
                onClick={() => handleVote(i)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 rounded-full text-xs font-semibold text-rose-600 shadow-2xs transition"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>{cap.votes}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Write Caption Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder={`Drop your funniest caption here, ${currentUser.name}...`}
            className="flex-1 px-4 py-2.5 bg-champagne-50/40 border border-rose-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="submit"
            disabled={!newCaption.trim()}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-semibold text-xs rounded-2xl shadow-md transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Post
          </button>
        </form>
      </div>
    </div>
  );
};
