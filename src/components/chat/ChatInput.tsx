import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Smile, X } from 'lucide-react';
import { ChatMessage } from '../../types';

interface ChatInputProps {
  onSendMessage: (text: string, imageUrl?: string, replyTo?: ChatMessage) => void;
  replyToMessage: ChatMessage | null;
  onCancelReply: () => void;
  onTyping: (isTyping: boolean) => void;
}

const COMMON_EMOJIS = ['❤️', '💖', '🥰', '😘', '🥺', '✨', '🌹', '🥂', '💌', '🌸', '😂', '🔥', '👀', '💯'];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  replyToMessage,
  onCancelReply,
  onTyping,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imageUrl) return;

    onSendMessage(text.trim(), imageUrl || undefined, replyToMessage || undefined);
    setText('');
    setImageUrl(null);
    setShowEmojiPicker(false);
    onCancelReply();
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleAddEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB) and type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Image size must be less than 8MB');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative border-t border-rose-100 dark:border-rose-900/40 bg-white/95 dark:bg-[#191322]/95 backdrop-blur-md p-3 md:p-4 rounded-b-3xl transition-colors">
      {/* Reply Banner */}
      {replyToMessage && (
        <div className="flex items-center justify-between bg-rose-50/80 dark:bg-rose-950/60 px-3 py-2 rounded-xl mb-2 text-xs border-l-4 border-rose-500">
          <div className="truncate pr-2">
            <span className="font-semibold text-rose-800 dark:text-rose-200">Replying to {replyToMessage.senderName}:</span>{' '}
            <span className="text-warmgray-600 dark:text-warmgray-300 truncate">{replyToMessage.text || 'Photo'}</span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-warmgray-400 dark:text-warmgray-400 hover:text-warmgray-700 dark:hover:text-warmgray-200 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Image Preview if attached */}
      {imageUrl && (
        <div className="relative inline-block mb-2">
          <img
            src={imageUrl}
            alt="Upload preview"
            className="h-20 w-20 object-cover rounded-xl border border-rose-200 dark:border-rose-800 shadow-sm"
          />
          <button
            onClick={() => setImageUrl(null)}
            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Emoji Picker Dropdown */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-50 bg-white dark:bg-[#221a2c] p-3 rounded-2xl shadow-xl border border-rose-100 dark:border-rose-900/50 grid grid-cols-7 gap-2 animate-scale-up">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="text-xl p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main input form */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2.5 rounded-xl transition ${
            showEmojiPicker ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60' : 'text-warmgray-400 dark:text-warmgray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60'
          }`}
          title="Insert emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Photo Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="p-2.5 text-warmgray-400 dark:text-warmgray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition"
          title="Attach photo"
        >
          <Image className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Write a sweet message..."
          className="flex-1 px-4 py-2.5 bg-champagne-50/50 dark:bg-[#251d30] hover:bg-white dark:hover:bg-[#2c223a] focus:bg-white dark:focus:bg-[#2c223a] border border-rose-200/80 dark:border-rose-900/50 rounded-2xl text-sm text-warmgray-800 dark:text-warmgray-100 placeholder-warmgray-400 dark:placeholder-warmgray-500 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() && !imageUrl}
          className="p-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-2xl shadow-sm hover:shadow-rose-200 transition transform active:scale-95"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
