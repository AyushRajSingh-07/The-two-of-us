import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Heart, RefreshCw, BookmarkCheck, BookOpen, Send } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fireHeartConfetti } from '../../common/Confetti';

interface ComplimentPrompt {
  id: string;
  category: 'Sweet' | 'Deep' | 'Playful' | 'Spicy';
  prompt: string;
}

const PROMPTS: ComplimentPrompt[] = [
  { id: 'p1', category: 'Sweet', prompt: 'What is a little habit of mine that never fails to make you smile?' },
  { id: 'p2', category: 'Deep', prompt: 'In what ways has being with me made you feel safest and most understood?' },
  { id: 'p3', category: 'Playful', prompt: 'What is the most adorable or funny mistake I’ve ever made in front of you?' },
  { id: 'p4', category: 'Spicy', prompt: 'What is your favorite romantic memory of us that still gives you chills?' },
  { id: 'p5', category: 'Sweet', prompt: 'What is one compliment you’ve thought about me recently but haven’t said out loud yet?' },
  { id: 'p6', category: 'Deep', prompt: 'What quality of mine do you admire the most when life gets stressful or busy?' },
  { id: 'p7', category: 'Playful', prompt: 'If you had to describe my personality using three foods or drinks, what would they be?' },
  { id: 'p8', category: 'Spicy', prompt: 'Where is your favorite place for us to steal a spontaneous hug or kiss?' },
];

interface SavedNote {
  id: string;
  from: string;
  category: string;
  prompt: string;
  answer: string;
  date: string;
}

export const ComplimentRoulette: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, partner } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [currentPrompt, setCurrentPrompt] = useState<ComplimentPrompt>(PROMPTS[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [answer, setAnswer] = useState('');
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>(() => {
    try {
      const raw = localStorage.getItem('two_of_us_compliment_jar');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showJar, setShowJar] = useState(false);

  const categories = ['All', 'Sweet', 'Deep', 'Playful', 'Spicy'];

  const filterPrompts = PROMPTS.filter((p) =>
    activeCategory === 'All' ? true : p.category === activeCategory
  );

  const spinWheel = () => {
    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      const random = filterPrompts[Math.floor(Math.random() * filterPrompts.length)];
      setCurrentPrompt(random);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleSaveToJar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    const newNote: SavedNote = {
      id: 'note-' + Date.now(),
      from: currentUser.name,
      category: currentPrompt.category,
      prompt: currentPrompt.prompt,
      answer: answer.trim(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    const updated = [newNote, ...savedNotes];
    setSavedNotes(updated);
    localStorage.setItem('two_of_us_compliment_jar', JSON.stringify(updated));
    setAnswer('');
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
          onClick={() => setShowJar(!showJar)}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Jar of Sweet Words ({savedNotes.length})</span>
        </button>
      </div>

      {showJar ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-warmgray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" /> Our Jar of Sweet Words
            </h2>
            <button
              onClick={() => setShowJar(false)}
              className="text-xs text-rose-600 underline font-semibold"
            >
              Back to Roulette
            </button>
          </div>

          {savedNotes.length === 0 ? (
            <p className="text-xs text-warmgray-500 text-center py-10">
              The jar is currently waiting for your first sweet words! Draw a prompt and leave a note.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {savedNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 to-champagne-50/80 border border-rose-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-rose-600 uppercase mb-1">
                      <span>{note.category}</span>
                      <span>{note.date}</span>
                    </div>
                    <p className="text-xs font-semibold text-warmgray-800 italic mb-2">"{note.prompt}"</p>
                    <p className="text-xs text-warmgray-700 font-serif leading-relaxed">{note.answer}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-rose-100 text-[10px] text-right font-medium text-rose-700">
                    With love, {note.from} 💕
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-warmgray-900">Compliment Roulette</h2>
            <p className="text-xs text-warmgray-500 mt-1">
              Spin to draw a heartfelt question or prompt, and answer it for {partner.name}!
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  const list = PROMPTS.filter((p) => (cat === 'All' ? true : p.category === cat));
                  setCurrentPrompt(list[0] || PROMPTS[0]);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-warmgray-100 hover:bg-rose-50 text-warmgray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Roulette Card Display */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-champagne-50 border-2 border-rose-200 shadow-md text-center">
            <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
              {currentPrompt.category} Prompt
            </span>
            <p
              className={`font-serif text-lg sm:text-xl font-bold text-warmgray-900 min-h-16 flex items-center justify-center transition-all ${
                isSpinning ? 'opacity-40 scale-95 blur-[0.5px]' : 'opacity-100 scale-100'
              }`}
            >
              "{currentPrompt.prompt}"
            </p>

            <div className="mt-4">
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-semibold text-xs rounded-xl shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>Spin For Another Prompt</span>
              </button>
            </div>
          </div>

          {/* Answer input */}
          <form onSubmit={handleSaveToJar} className="space-y-3">
            <label className="block text-xs font-semibold text-warmgray-700">
              Your Answer for {partner.name}:
            </label>
            <textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Pour your heart out into this message..."
              className="w-full p-3.5 bg-champagne-50/40 border border-rose-200 rounded-2xl text-xs sm:text-sm text-warmgray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!answer.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-md transition"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Save to Our Jar of Sweet Words 💕</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
