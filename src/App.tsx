import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { SettingsModal } from './components/common/SettingsModal';
import { PairingScreen } from './components/common/PairingScreen';
import { DailyLoginCounter } from './components/common/DailyLoginCounter';
import { GamesHub } from './components/games/GamesHub';
import { ChatView } from './components/chat/ChatView';
import { PhotosView } from './components/photos/PhotosView';
import { DataStore } from './lib/store';
import { Heart, Sparkles, MessageCircle, Gamepad2, Image } from 'lucide-react';
import { calculateTimeTogether } from './lib/utils';

const MainAppContent: React.FC = () => {
  const { couple, currentUser, isPaired, isPartner1Active, switchActiveUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'games' | 'chat' | 'photos'>('games');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pairedOverride, setPairedOverride] = useState(false);

  // Parse URL query parameters on initial load (e.g. from mobile QR code / invite link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'chat' || tabParam === 'photos' || tabParam === 'games') {
      setActiveTab(tabParam);
    }
    const roleParam = params.get('role');
    if (roleParam === 'partner2' && isPartner1Active) {
      switchActiveUser();
    } else if (roleParam === 'partner1' && !isPartner1Active) {
      switchActiveUser();
    }
  }, []);

  // Compute unread message count
  useEffect(() => {
    if (!couple) return;
    const checkUnread = async () => {
      const msgs = await DataStore.getMessages(couple.id);
      const unread = msgs.filter((m) => m.senderId !== currentUser.id && !m.isRead).length;
      setUnreadCount(unread);
    };

    checkUnread();
    const unsub = DataStore.onSync((e) => {
      if (e.type === 'CHAT_UPDATED') {
        checkUnread();
      }
    });
    return unsub;
  }, [couple?.id, currentUser.id]);

  // If space is marked as not paired yet
  if (!isPaired && !pairedOverride) {
    return <PairingScreen onPaired={() => setPairedOverride(true)} />;
  }

  const timeStats = calculateTimeTogether(couple?.anniversaryDate || '');

  return (
    <div className="min-h-screen bg-[#faf8f6] text-warmgray-800 flex flex-col font-sans selection:bg-rose-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        unreadCount={unreadCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Welcome Love Banner on Games and Photos tabs */}
        {activeTab !== 'chat' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white/70 backdrop-blur-xs rounded-2xl border border-rose-100 shadow-2xs">
            <div className="flex items-center gap-2.5 text-xs text-warmgray-600">
              <span className="p-1.5 bg-rose-50 text-rose-500 rounded-lg">
                <Heart className="w-4 h-4 fill-rose-500" />
              </span>
              <span>
                {couple?.welcomeMessage || 'Welcome to our private corner of the universe.'}
              </span>
            </div>

            <div className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60 whitespace-nowrap">
              {timeStats.totalDays} days of joy together ✨
            </div>
          </div>
        )}

        {/* Shared Daily Login Counter (Ayush & Vrishti in Asia/Kolkata) */}
        {activeTab !== 'chat' && <DailyLoginCounter />}

        {/* Tab View Switcher */}
        {activeTab === 'games' && <GamesHub />}
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'photos' && <PhotosView />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
