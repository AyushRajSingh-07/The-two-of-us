import React, { useState } from 'react';
import { Gamepad2, Heart, Smile, Users, Search, Sparkles, Trophy } from 'lucide-react';
import { GameInfo, CategoryType } from '../../types';

// Import All 15 Games
import { QuizGame } from './romantic/QuizGame';
import { MemoryMatchGame } from './romantic/MemoryMatchGame';
import { StoryTimelineGame } from './romantic/StoryTimelineGame';
import { ComplimentRoulette } from './romantic/ComplimentRoulette';
import { PickOurDateGame } from './romantic/PickOurDateGame';

import { ThisOrThatGame } from './funny/ThisOrThatGame';
import { CaptionThisGame } from './funny/CaptionThisGame';
import { EmojiCharadesGame } from './funny/EmojiCharadesGame';
import { TwoTruthsGame } from './funny/TwoTruthsGame';
import { RidiculousQuizGame } from './funny/RidiculousQuizGame';

import { TogetherMazeGame } from './coop/TogetherMazeGame';
import { EscapeRoomGame } from './coop/EscapeRoomGame';
import { DrawAndGuessGame } from './coop/DrawAndGuessGame';
import { RhythmTeamUpGame } from './coop/RhythmTeamUpGame';
import { GardenGame } from './coop/GardenGame';

const ALL_GAMES: GameInfo[] = [
  // 5 Romantic Games
  {
    id: 'romantic_quiz',
    title: 'How Well Do You Know Us?',
    category: 'romantic',
    tagline: 'Customizable quiz on our love story',
    description: 'Test your knowledge on our relationship milestones, first dates, and inside memories. Add your own questions anytime!',
    icon: '💕',
    playersBadge: 'Solo or 2-Player',
    difficulty: 'Cozy',
  },
  {
    id: 'romantic_memory',
    title: 'Our Memory Match',
    category: 'romantic',
    tagline: 'Card match featuring shared moments',
    description: 'Flip and match couples cards celebrating first coffee dates, stargazing, road trips, and movie cuddles.',
    icon: '☕',
    playersBadge: 'Solo or 2-Player',
    difficulty: 'Easy',
  },
  {
    id: 'romantic_timeline',
    title: 'Our Story Timeline',
    category: 'romantic',
    tagline: 'Arrange milestones in exact order',
    description: 'Can you remember every step of our love story from the first message to today? Test your chronological memory!',
    icon: '📜',
    playersBadge: 'Solo or 2-Player',
    difficulty: 'Cozy',
  },
  {
    id: 'romantic_compliment',
    title: 'Compliment Roulette',
    category: 'romantic',
    tagline: 'Spin prompts & build a keepsake jar',
    description: 'Draw sweet, deep, or spicy prompts and answer them for each other. Saves answers to your permanent Jar of Sweet Words!',
    icon: '🎰',
    playersBadge: '2-Player Interactive',
    difficulty: 'Spicy',
  },
  {
    id: 'romantic_date',
    title: 'Pick Our Date',
    category: 'romantic',
    tagline: 'Bespoke couple date planner',
    description: 'Filter by current mood, time of day, and budget to generate a curated 3-step date night agenda with a secret surprise!',
    icon: '✨',
    playersBadge: 'Decision Maker',
    difficulty: 'Cozy',
  },

  // 5 Funny Games
  {
    id: 'funny_this_that',
    title: 'Couple This or That',
    category: 'funny',
    tagline: 'Rapid-fire silly choices & vibe match',
    description: 'Answer fast-paced dilemmas and see your couple personality match fingerprint!',
    icon: '⚖️',
    playersBadge: 'Solo or 2-Player',
    difficulty: 'Playful',
  },
  {
    id: 'funny_caption',
    title: 'Caption This',
    category: 'funny',
    tagline: 'Write funniest captions & vote',
    description: 'Take turns dropping hilarious captions for couple scenarios and upvote each other\'s best roasts.',
    icon: '🖼️',
    playersBadge: '2-Player Turn',
    difficulty: 'Playful',
  },
  {
    id: 'funny_charades',
    title: 'Emoji Charades',
    category: 'funny',
    tagline: 'Guess movies & memories from emojis',
    description: 'Decrypt strings of emojis with hints to guess iconic date movies, romantic songs, and adventures.',
    icon: '🧐',
    playersBadge: 'Solo or 2-Player',
    difficulty: 'Playful',
  },
  {
    id: 'funny_two_truths',
    title: 'Two Truths and a Lie',
    category: 'funny',
    tagline: 'Spot the lie among hilarious facts',
    description: 'Guess which wild confession is fabricated, or create custom rounds to trick your partner!',
    icon: '🤥',
    playersBadge: '2-Player Turn',
    difficulty: 'Playful',
  },
  {
    id: 'funny_ridiculous',
    title: 'The Ridiculous Quiz',
    category: 'funny',
    tagline: 'Existential & hilarious couples dilemmas',
    description: 'Would you love me if I was a worm? What is our zombie apocalypse strategy? Earn your custom couple badge!',
    icon: '🪱',
    playersBadge: 'Solo or 2-Player',
    difficulty: 'Playful',
  },

  // 5 Co-op Multiplayer Games
  {
    id: 'coop_maze',
    title: 'Together Maze',
    category: 'coop',
    tagline: 'Real-time 2-player cooperative puzzle',
    description: 'Coordinate player moves on pressure plates to lower gates for each other and meet at the center heart.',
    icon: '💖',
    playersBadge: 'Co-op Real-time',
    difficulty: 'Cozy',
  },
  {
    id: 'coop_escape',
    title: 'Mini Escape Room',
    category: 'coop',
    tagline: 'Search room clues & crack the lockbox',
    description: 'Investigate the desk, bookshelf, and music box together to deduce the 4-digit combination and unlock the love note.',
    icon: '🔐',
    playersBadge: 'Co-op Shared State',
    difficulty: 'Easy',
  },
  {
    id: 'coop_draw_guess',
    title: 'Draw and Guess',
    category: 'coop',
    tagline: 'Synchronized live sketch & word guess',
    description: 'One partner sketches in real time with an artistic color palette while the other guesses the secret word!',
    icon: '🎨',
    playersBadge: 'Co-op Real-time',
    difficulty: 'Playful',
  },
  {
    id: 'coop_rhythm',
    title: 'Rhythm Team-Up',
    category: 'coop',
    tagline: 'Harmonious heartbeat rhythm game',
    description: 'Hit synchronized musical beats across dual lanes to build a harmonious couple combo score.',
    icon: '🎶',
    playersBadge: 'Co-op Real-time',
    difficulty: 'Playful',
  },
  {
    id: 'coop_garden',
    title: 'Little Shared Garden',
    category: 'coop',
    tagline: 'Grow virtual flowers & strawberries together',
    description: 'Plant seeds, water sprouts, and watch your shared private garden blossom in real time.',
    icon: '🪴',
    playersBadge: 'Co-op Persistent',
    difficulty: 'Cozy',
  },
];

export const GamesHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGameId, setActiveGameId] = useState<string | null>(() => {
    // Check initial URL parameters for game or session invite
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (gameParam && ALL_GAMES.some((g) => g.id === gameParam)) return gameParam;

    const sessionParam = params.get('session');
    if (sessionParam) {
      if (sessionParam.includes('maze')) return 'coop_maze';
      if (sessionParam.includes('escape')) return 'coop_escape';
      if (sessionParam.includes('draw_guess')) return 'coop_draw_guess';
      if (sessionParam.includes('rhythm')) return 'coop_rhythm';
      if (sessionParam.includes('garden')) return 'coop_garden';
    }
    return null;
  });

  const handleSelectGame = (gameId: string | null) => {
    setActiveGameId(gameId);
    const url = new URL(window.location.href);
    if (gameId) {
      url.searchParams.set('game', gameId);
    } else {
      url.searchParams.delete('game');
      url.searchParams.delete('session');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Render active game view
  if (activeGameId) {
    const handleBack = () => handleSelectGame(null);

    switch (activeGameId) {
      case 'romantic_quiz':
        return <QuizGame onBack={handleBack} />;
      case 'romantic_memory':
        return <MemoryMatchGame onBack={handleBack} />;
      case 'romantic_timeline':
        return <StoryTimelineGame onBack={handleBack} />;
      case 'romantic_compliment':
        return <ComplimentRoulette onBack={handleBack} />;
      case 'romantic_date':
        return <PickOurDateGame onBack={handleBack} />;

      case 'funny_this_that':
        return <ThisOrThatGame onBack={handleBack} />;
      case 'funny_caption':
        return <CaptionThisGame onBack={handleBack} />;
      case 'funny_charades':
        return <EmojiCharadesGame onBack={handleBack} />;
      case 'funny_two_truths':
        return <TwoTruthsGame onBack={handleBack} />;
      case 'funny_ridiculous':
        return <RidiculousQuizGame onBack={handleBack} />;

      case 'coop_maze':
        return <TogetherMazeGame onBack={handleBack} />;
      case 'coop_escape':
        return <EscapeRoomGame onBack={handleBack} />;
      case 'coop_draw_guess':
        return <DrawAndGuessGame onBack={handleBack} />;
      case 'coop_rhythm':
        return <RhythmTeamUpGame onBack={handleBack} />;
      case 'coop_garden':
        return <GardenGame onBack={handleBack} />;

      default:
        return null;
    }
  }

  // Filter games
  const filteredGames = ALL_GAMES.filter((g) => {
    const matchesCat = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in transition-colors">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-100/80 via-champagne-100/70 to-rose-50/80 dark:from-[#231b2e] dark:via-[#1e1628] dark:to-[#251a2d] rounded-3xl p-6 sm:p-8 border border-rose-200/60 dark:border-rose-900/50 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300 tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Couples' Arcade</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-warmgray-900 dark:text-warmgray-100">
            Our Playroom
          </h1>
          <p className="text-sm text-warmgray-600 dark:text-warmgray-400 mt-1">
            15 games designed specifically for the two of us. From heartfelt romance and laugh-out-loud quizzes to synchronized co-op adventures!
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1f1729] hover:bg-rose-50 dark:hover:bg-[#2c223a] text-warmgray-600 dark:text-warmgray-300 border border-warmgray-200 dark:border-rose-900/40'
            }`}
          >
            All Games (15)
          </button>

          <button
            onClick={() => setSelectedCategory('romantic')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedCategory === 'romantic'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1f1729] hover:bg-rose-50 dark:hover:bg-[#2c223a] text-warmgray-600 dark:text-warmgray-300 border border-warmgray-200 dark:border-rose-900/40'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Romantic (5)</span>
          </button>

          <button
            onClick={() => setSelectedCategory('funny')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedCategory === 'funny'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1f1729] hover:bg-rose-50 dark:hover:bg-[#2c223a] text-warmgray-600 dark:text-warmgray-300 border border-warmgray-200 dark:border-rose-900/40'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Funny (5)</span>
          </button>

          <button
            onClick={() => setSelectedCategory('coop')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedCategory === 'coop'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1f1729] hover:bg-rose-50 dark:hover:bg-[#2c223a] text-warmgray-600 dark:text-warmgray-300 border border-warmgray-200 dark:border-rose-900/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Co-op Real-time (5)</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warmgray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1f1729] border border-warmgray-200 dark:border-rose-900/40 rounded-xl text-xs text-warmgray-800 dark:text-warmgray-100 placeholder-warmgray-400 dark:placeholder-warmgray-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            onClick={() => handleSelectGame(game.id)}
            className="group bg-white dark:bg-[#191422] rounded-3xl p-6 border border-rose-100/90 dark:border-rose-900/40 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Header with icon & badge */}
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl p-2.5 bg-rose-50 dark:bg-[#251d30] rounded-2xl group-hover:scale-110 transition-transform shadow-xs">
                  {game.icon}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    game.category === 'coop'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : game.category === 'romantic'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {game.playersBadge}
                </span>
              </div>

              {/* Title & Tagline */}
              <h3 className="font-serif font-bold text-lg text-warmgray-900 dark:text-warmgray-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {game.title}
              </h3>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 mb-2">
                {game.tagline}
              </p>
              <p className="text-xs text-warmgray-600 dark:text-warmgray-300 leading-relaxed line-clamp-3">
                {game.description}
              </p>
            </div>

            {/* Footer with play CTA */}
            <div className="mt-5 pt-3 border-t border-rose-50 dark:border-rose-900/30 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-warmgray-400 dark:text-warmgray-400">
                {game.difficulty ? `Vibe: ${game.difficulty}` : ''}
              </span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Play Game →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
