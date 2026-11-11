import React from 'react';
import { Heart, Sparkles, MessageCircle, Image, Gamepad2, Settings, ArrowLeftRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  activeTab: 'games' | 'chat' | 'photos' | 'profile' | 'settings';
  setActiveTab: (tab: 'games' | 'chat' | 'photos' | 'profile' | 'settings') => void;
  onOpenSettings?: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadCount = 0,
}) => {
  const { couple, currentUser, partner, switchActiveUser, dailyCounter } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-rose-100/80 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Left: Brand & Couple Names */}
          <div 
            onClick={() => setActiveTab('games')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex -space-x-2 overflow-hidden">
              <img
                src={couple?.partner1Avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={couple?.partner1Name}
                className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm group-hover:scale-105 transition"
              />
              <img
                src={couple?.partner2Avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                alt={couple?.partner2Name}
                className="inline-block h-9 w-9 rounded-full ring-2 ring-rose-200 object-cover shadow-sm group-hover:scale-105 transition"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base md:text-lg text-warmgray-900 tracking-tight">
                  {couple?.partner1Name}
                </span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                <span className="font-serif font-bold text-base md:text-lg text-warmgray-900 tracking-tight">
                  {couple?.partner2Name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                <Sparkles className="w-3 h-3 text-rose-400" />
                <span>{dailyCounter.sharedCount} Love Days</span>
              </div>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-rose-50/60 p-1.5 rounded-2xl border border-rose-100/60">
            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'games'
                  ? 'bg-white text-rose-700 shadow-sm shadow-rose-100'
                  : 'text-warmgray-600 hover:text-rose-600 hover:bg-white/40'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Games</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-rose-100 text-rose-700 rounded-full font-bold">15</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-rose-700 shadow-sm shadow-rose-100'
                  : 'text-warmgray-600 hover:text-rose-600 hover:bg-white/40'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'photos'
                  ? 'bg-white text-rose-700 shadow-sm shadow-rose-100'
                  : 'text-warmgray-600 hover:text-rose-600 hover:bg-white/40'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Photos</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-rose-700 shadow-sm shadow-rose-100'
                  : 'text-warmgray-600 hover:text-rose-600 hover:bg-white/40'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profiles</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-rose-700 shadow-sm shadow-rose-100'
                  : 'text-warmgray-600 hover:text-rose-600 hover:bg-white/40'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right: User Switcher & Settings */}
          <div className="flex items-center gap-2">
            {/* Quick Switcher for Testing/Co-op */}
            <button
              onClick={switchActiveUser}
              title={`Switch active view to ${partner.name}`}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-warmgray-700 bg-champagne-100/70 hover:bg-champagne-200/80 border border-champagne-300/60 rounded-xl transition shadow-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-champagne-600" />
              <span className="hidden sm:inline">Viewing as</span>
              <span className="font-bold text-rose-700">{currentUser.name}</span>
            </button>

            {/* Profile avatar shortcut */}
            <button
              onClick={() => setActiveTab('profile')}
              title="My Profile"
              className="hidden sm:flex items-center p-1 rounded-full ring-2 ring-transparent hover:ring-rose-300 transition"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            </button>

            {/* Sanctuary Settings button */}
            <button
              onClick={() => setActiveTab('settings')}
              title="Sanctuary Settings & Invite Code"
              className={`p-2 rounded-xl border transition ${
                activeTab === 'settings'
                  ? 'bg-rose-100/80 text-rose-700 border-rose-200'
                  : 'text-warmgray-500 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-100'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('games')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'games' ? 'text-rose-600 font-bold' : 'text-warmgray-500'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px]">Games</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'chat' ? 'text-rose-600 font-bold' : 'text-warmgray-500'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px]">Chat</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white bg-rose-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'photos' ? 'text-rose-600 font-bold' : 'text-warmgray-500'
          }`}
        >
          <Image className="w-5 h-5" />
          <span className="text-[10px]">Photos</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'profile' ? 'text-rose-600 font-bold' : 'text-warmgray-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'settings' ? 'text-rose-600 font-bold' : 'text-warmgray-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </div>
    </header>
  );
};
