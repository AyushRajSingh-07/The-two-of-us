import React, { useState } from 'react';
import { ArrowLeft, Sparkles, MapPin, Clock, DollarSign, Heart, Check, Share2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fireHeartConfetti } from '../../common/Confetti';
import { DataStore } from '../../../lib/store';

interface DatePlan {
  title: string;
  vibe: string;
  description: string;
  steps: string[];
  surprise: string;
  estimatedTime: string;
}

const DATE_IDEAS: Record<string, DatePlan> = {
  cozy: {
    title: 'The Living Room Blanket Fort Cinema',
    vibe: 'Cozy & Nostalgic',
    description: 'Turn off all overhead lights, gather every pillow in the house, make gourmet popcorn, and watch our favorite comfort film.',
    steps: [
      'Build an elaborate blanket and fairy light fort together.',
      'Make stove-top popcorn with truffle butter or cinnamon sugar.',
      'Watch two movies while sharing one big fuzzy blanket.',
    ],
    surprise: 'Surprise dessert: hot mug brownies with vanilla ice cream!',
    estimatedTime: '3 - 4 hours',
  },
  adventure: {
    title: 'Sunset Viewpoint & Stargazing Picnic',
    vibe: 'Romantic & Scenic',
    description: 'Pack a basket of cheeses, fruit, and sparkling cider, drive to a high viewpoint, watch the sunset, and look for constellations.',
    steps: [
      'Pack our favorite snacks and a cozy picnic blanket.',
      'Reach the viewpoint right as the golden hour sky turns lavender.',
      'Play our favorite acoustic playlist and find shooting stars.',
    ],
    surprise: 'A handwritten letter to read aloud as the first stars appear.',
    estimatedTime: '2 - 3 hours',
  },
  foodie: {
    title: 'The Mystery Two-Chef Cook-off',
    vibe: 'Culinary & Playful',
    description: 'We pick 3 secret ingredients each from the local grocery store and invent a brand new pasta or taco fusion together.',
    steps: [
      'Take 15 minutes at the market picking surprise ingredients.',
      'Put on an Italian cooking jazz playlist in the kitchen.',
      'Plate the food fancy like a 5-star Michelin restaurant.',
    ],
    surprise: 'Score each other’s plating skills with funny handheld signs.',
    estimatedTime: '2.5 hours',
  },
  playful: {
    title: 'Arcade Battle & Late-Night Dessert Hunt',
    vibe: 'Playful & High Energy',
    description: 'Compete in air hockey and Mario Kart, win ridiculous plushies, and finish with a midnight waffle run.',
    steps: [
      'Spend 100 arcade credits competing for highest high-score.',
      'Photobooth session making silly faces in the vintage booth.',
      'Hunt down the best 24-hour dessert parlour in town.',
    ],
    surprise: 'Whoever gets lower arcade tickets buys the milkshakes!',
    estimatedTime: '3 hours',
  },
};

export const PickOurDateGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, couple } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState('cozy');
  const [timeOfDay, setTimeOfDay] = useState('Golden Hour Sunset');
  const [budget, setBudget] = useState('Casual Fun');
  const [revealedPlan, setRevealedPlan] = useState<DatePlan | null>(null);
  const [sharedSuccess, setSharedSuccess] = useState(false);

  const handleGenerate = () => {
    const plan = DATE_IDEAS[selectedVibe] || DATE_IDEAS.cozy;
    setRevealedPlan(plan);
    fireHeartConfetti();
  };

  const handleSendToChat = async () => {
    if (!couple || !revealedPlan) return;
    const chatText = `💌 Date Night Proposal: "${revealedPlan.title}" (${revealedPlan.vibe})\n• Agenda: ${revealedPlan.steps.join(' → ')}\n• Surprise: ${revealedPlan.surprise}`;
    await DataStore.sendMessage({
      spaceId: couple.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: chatText,
    });
    setSharedSuccess(true);
    setTimeout(() => setSharedSuccess(false), 2500);
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
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-warmgray-900">Pick Our Date</h2>
        <p className="text-xs text-warmgray-500 mt-1 max-w-md mx-auto">
          Can't decide what to do for our next date? Dial in your current mood and let fate craft our perfect evening!
        </p>
      </div>

      {revealedPlan ? (
        <div className="space-y-6 animate-scale-up">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-champagne-50 border-2 border-rose-200 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-rose-600 uppercase mb-2">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {revealedPlan.vibe}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {revealedPlan.estimatedTime}
              </span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-warmgray-900 mb-2">
              {revealedPlan.title}
            </h3>
            <p className="text-sm text-warmgray-600 mb-6">{revealedPlan.description}</p>

            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold text-warmgray-700 uppercase tracking-wider">
                The 3-Step Date Agenda:
              </h4>
              {revealedPlan.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white/80 rounded-xl border border-rose-100 text-xs text-warmgray-800">
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-rose-100/60 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Secret Element: </span>
                <span>{revealedPlan.surprise}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setRevealedPlan(null)}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-warmgray-600 hover:text-warmgray-800 border border-warmgray-200 rounded-xl transition"
            >
              Choose Different Vibe
            </button>
            <button
              onClick={handleSendToChat}
              className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-2"
            >
              {sharedSuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{sharedSuccess ? 'Sent to Our Chat!' : 'Propose This Date in Chat 💕'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Vibe Selection */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-2">
              1. What's the mood?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'cozy', label: 'Cozy & Chill', icon: '🛋️' },
                { id: 'adventure', label: 'Outdoor Scenic', icon: '🌅' },
                { id: 'foodie', label: 'Foodie Cooking', icon: '🍝' },
                { id: 'playful', label: 'Arcade & Fun', icon: '🕹️' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVibe(v.id)}
                  className={`p-3 rounded-2xl border text-center transition ${
                    selectedVibe === v.id
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs font-bold'
                      : 'bg-white border-warmgray-200 text-warmgray-700 hover:bg-rose-50/30'
                  }`}
                >
                  <span className="text-2xl block mb-1">{v.icon}</span>
                  <span className="text-xs">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-2">
              2. Preferred Time of Day
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Sunny Morning', 'Afternoon Chill', 'Golden Hour Sunset', 'Late Night Glow'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeOfDay(t)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                    timeOfDay === t
                      ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold'
                      : 'bg-white border-warmgray-200 text-warmgray-600 hover:bg-rose-50/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 uppercase tracking-wider mb-2">
              3. Budget Level
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {['Cozy Free / Homemade', 'Casual Fun ($)', 'Special Treat ($$)'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                    budget === b
                      ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold'
                      : 'bg-white border-warmgray-200 text-warmgray-600 hover:bg-rose-50/20'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-2xl shadow-md hover:shadow-rose-200 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Reveal Our Perfect Date Plan ✨</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
