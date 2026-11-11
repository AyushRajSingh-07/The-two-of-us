import React, { useState, useEffect, useRef } from 'react';
import { Search, Heart, ShieldCheck, Sparkles, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types';
import { DataStore } from '../../lib/store';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { formatDate } from '../../lib/utils';

export const ChatView: React.FC = () => {
  const { couple, currentUser, partner } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load messages
  const loadMessages = async () => {
    if (!couple) return;
    const msgs = await DataStore.getMessages(couple.id);
    setMessages(msgs);
    // Mark received messages as read
    await DataStore.markMessagesAsRead(couple.id, currentUser.id);
  };

  useEffect(() => {
    loadMessages();
    const unsub = DataStore.onSync((e) => {
      if (e.type === 'CHAT_UPDATED') {
        setMessages(e.payload);
        if (couple) DataStore.markMessagesAsRead(couple.id, currentUser.id);
      } else if (e.type === 'TYPING_STATUS') {
        if (e.payload.userId === partner.id) {
          setPartnerTyping(Boolean(e.payload.isTyping));
        }
      }
    });
    return unsub;
  }, [couple?.id, currentUser.id, partner.id]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (!searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, searchQuery]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 150);
  };

  const handleSendMessage = async (text: string, imageUrl?: string, replyTo?: ChatMessage) => {
    if (!couple) return;
    await DataStore.sendMessage({
      spaceId: couple.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      imageUrl,
      replyToId: replyTo?.id,
      replyToText: replyTo?.text,
      replyToSender: replyTo?.senderName,
    });
    await loadMessages();
  };

  const handleTyping = (isTyping: boolean) => {
    // Notify local broadcast
    if (couple) {
      const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('two-of-us-sync') : null;
      bc?.postMessage({
        type: 'TYPING_STATUS',
        payload: { userId: currentUser.id, isTyping },
      });
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    await DataStore.toggleReaction(messageId, emoji, currentUser.id);
    await loadMessages();
  };

  const handleEdit = async (messageId: string, newText: string) => {
    await DataStore.editMessage(messageId, newText);
    await loadMessages();
  };

  const handleDelete = async (messageId: string) => {
    await DataStore.deleteMessage(messageId);
    await loadMessages();
  };

  // Filter messages by search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100dvh-11.5rem)] md:h-[calc(100vh-9.5rem)] flex flex-col bg-white/90 dark:bg-[#15111c]/90 backdrop-blur-md rounded-3xl border border-rose-100 dark:border-rose-900/40 shadow-xl overflow-hidden animate-fade-in transition-colors">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-rose-100 dark:border-rose-900/40 bg-white/95 dark:bg-[#191322]/95 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={partner.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={partner.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-rose-300 dark:border-rose-700 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#191322] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-serif font-bold text-base text-warmgray-900 dark:text-warmgray-100">{partner.name}</h2>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </div>
            <p className="text-xs text-warmgray-500 dark:text-warmgray-400 flex items-center gap-1">
              {partnerTyping ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> typing a sweet message...
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Private couple channel</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Search toggle */}
        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="flex items-center gap-1.5 bg-rose-50/80 dark:bg-[#251d30] px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50">
              <Search className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search our messages..."
                className="bg-transparent text-xs text-warmgray-800 dark:text-warmgray-100 placeholder-warmgray-400 dark:placeholder-warmgray-500 focus:outline-none w-36 sm:w-48"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="text-warmgray-400 hover:text-warmgray-600 dark:hover:text-warmgray-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition"
              title="Search conversation"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gradient-to-b from-[#fdfbf9] to-[#faf7f5] dark:from-[#130f1a] dark:to-[#0f0d14] transition-colors"
      >
        {searchQuery && (
          <div className="text-center text-xs text-warmgray-500 dark:text-warmgray-300 bg-rose-50/60 dark:bg-[#20182a] py-1.5 rounded-lg mb-2 border border-rose-100 dark:border-rose-900/30">
            Found {filteredMessages.length} message{filteredMessages.length === 1 ? '' : 's'} matching "{searchQuery}"
          </div>
        )}

        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center mb-3">
              <Heart className="w-7 h-7 fill-rose-100 dark:fill-rose-900/60" />
            </div>
            <h3 className="font-serif font-bold text-lg text-warmgray-800 dark:text-warmgray-100">Our Private Love Journal</h3>
            <p className="text-xs text-warmgray-500 dark:text-warmgray-400 max-w-xs mt-1">
              Every message here is encrypted between the two of you. Say something sweet to kick off today!
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe = msg.senderId === currentUser.id;
            const prevMsg = filteredMessages[index - 1];
            const showDateHeader = !prevMsg || formatDate(prevMsg.createdAt) !== formatDate(msg.createdAt);

            return (
              <React.Fragment key={msg.id}>
                {showDateHeader && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-[11px] font-semibold text-warmgray-400 dark:text-warmgray-300 bg-white/80 dark:bg-[#20182a]/80 border border-warmgray-200/60 dark:border-rose-900/40 px-3 py-1 rounded-full shadow-2xs">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isMe={isMe}
                  currentUserId={currentUser.id}
                  onReply={(m) => setReplyTarget(m)}
                  onReact={handleReact}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onImageClick={(url) => setZoomedImage(url)}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Typing indicator bubble */}
        {partnerTyping && (
          <div className="flex items-center gap-2 mt-2">
            <img
              src={partner.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={partner.name}
              className="w-7 h-7 rounded-full object-cover border border-rose-200 dark:border-rose-800"
            />
            <div className="bg-white dark:bg-[#20182a] border border-rose-100 dark:border-rose-900/40 px-3 py-2 rounded-2xl rounded-bl-xs flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-20 right-6 p-2 bg-white dark:bg-[#20182a] text-rose-600 dark:text-rose-400 rounded-full shadow-lg border border-rose-100 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Input bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        replyToMessage={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
        onTyping={handleTyping}
      />

      {/* Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={zoomedImage} alt="Enlarged photo" className="max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-white dark:bg-[#20182a] text-warmgray-800 dark:text-warmgray-100 rounded-full shadow-lg hover:bg-rose-50 dark:hover:bg-rose-950/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
