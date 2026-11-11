import React, { useState } from 'react';
import { Check, CheckCheck, Reply, Trash2, Edit2, Smile, X, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../../types';
import { formatTime } from '../../lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  currentUserId: string;
  onReply: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, newText: string) => void;
  onDelete: (messageId: string) => void;
  onRetry?: (message: ChatMessage) => void;
  onImageClick?: (url: string) => void;
}

const QUICK_REACTIONS = ['❤️', '🥰', '😘', '😂', '🥺', '✨', '🔥'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onRetry,
  onImageClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim() && editText !== message.text) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const reactionEntries = Object.entries(message.reactions || {}).filter(([_, users]) => users.length > 0);

  return (
    <div
      className={`group relative flex flex-col my-1.5 transition-all ${
        isMe ? 'items-end' : 'items-start'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Sender name for received messages */}
      {!isMe && (
        <span className="text-[11px] font-medium text-warmgray-500 dark:text-warmgray-400 mb-1 ml-11">
          {message.senderName}
        </span>
      )}

      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <img
          src={message.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={message.senderName}
          className="w-8 h-8 rounded-full object-cover border border-rose-200 dark:border-rose-800 shadow-xs flex-shrink-0"
        />

        {/* Bubble Container */}
        <div className="relative">
          <div
            onClick={() => setIsHovered((prev) => !prev)}
            className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all text-sm leading-relaxed cursor-pointer select-text ${
              isMe
                ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-[#20182a] border border-rose-100 dark:border-rose-900/40 text-warmgray-800 dark:text-warmgray-100 rounded-bl-sm'
            }`}
          >
            {/* Replied Message Preview */}
            {message.replyToText && (
              <div
                className={`mb-2 p-2 rounded-xl text-xs border-l-2 ${
                  isMe
                    ? 'bg-rose-700/50 border-white/80 text-rose-100'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-500 text-warmgray-600 dark:text-warmgray-300'
                }`}
              >
                <span className="font-semibold">{message.replyToSender || 'Partner'}:</span>{' '}
                <span className="line-clamp-1">{message.replyToText}</span>
              </div>
            )}

            {/* Photo Message */}
            {message.imageUrl && (
              <div className="mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => onImageClick?.(message.imageUrl!)}>
                <img
                  src={message.imageUrl}
                  alt="Attachment"
                  className="max-h-60 rounded-xl object-cover hover:opacity-95 transition"
                />
              </div>
            )}

            {/* Message Text or Inline Edit */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-1.5 py-1">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="px-2.5 py-1 rounded-lg text-sm bg-white dark:bg-[#2c223a] text-warmgray-800 dark:text-warmgray-100 border border-rose-300 dark:border-rose-700 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-[11px] opacity-80 hover:opacity-100 underline text-warmgray-500 dark:text-warmgray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-[11px] font-bold bg-white dark:bg-[#342745] text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                {message.editedAt && (
                  <span className={`text-[10px] italic ml-1 ${isMe ? 'text-rose-200' : 'text-warmgray-400'}`}>
                    (edited)
                  </span>
                )}
              </div>
            )}

            {/* Footer with Timestamp & Status ticks / Sending / Failed */}
            <div
              className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                isMe ? 'text-rose-100' : 'text-warmgray-400 dark:text-warmgray-400'
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isMe && (
                message.status === 'sending' || message.status === 'retrying' ? (
                  <span className="flex items-center gap-1 text-rose-200" title={message.status === 'retrying' ? "Retrying save..." : "Saving to database..."}>
                    <Clock className="w-3 h-3 animate-pulse" />
                    <span>{message.status === 'retrying' ? 'Retrying' : 'Sending'}</span>
                  </span>
                ) : message.status === 'failed' ? (
                  <span className="flex items-center gap-1 text-amber-200 font-semibold" title="Not delivered">
                    <AlertCircle className="w-3 h-3 text-amber-300" />
                    <span>Failed</span>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry(message);
                        }}
                        className="ml-1 px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-0.5 transition cursor-pointer"
                        title="Retry sending"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Retry</span>
                      </button>
                    )}
                  </span>
                ) : message.isRead ? (
                  <span title="Read by partner"><CheckCheck className="w-3.5 h-3.5 text-rose-200" /></span>
                ) : (
                  <span title="Delivered to database"><Check className="w-3.5 h-3.5 text-rose-200" /></span>
                )
              )}
            </div>
          </div>

          {/* Emoji Reactions Bar below bubble */}
          {reactionEntries.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {reactionEntries.map(([emoji, users]) => {
                const hasReacted = users.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => onReact(message.id, emoji)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shadow-xs transition ${
                      hasReacted
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'bg-white dark:bg-[#231a2e] border-warmgray-200 dark:border-rose-900/40 text-warmgray-600 dark:text-warmgray-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/50'
                    }`}
                  >
                    <span>{emoji}</span>
                    {users.length > 1 && <span>{users.length}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Toolbar (Visible on hover on desktop, or tap on mobile) */}
          {isHovered && !isEditing && (
            <div
              className={`absolute top-0 transform -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-[#221a2c] border border-rose-200 dark:border-rose-900/60 shadow-lg rounded-full px-2 py-1 z-20 animate-fade-in ${
                isMe ? 'right-0' : 'left-0'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactionPicker(!showReactionPicker);
                }}
                className="w-8 h-8 flex items-center justify-center text-warmgray-500 dark:text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-300 active:bg-rose-50 dark:active:bg-rose-950/60 rounded-full transition"
                title="React"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(message);
                  setIsHovered(false);
                }}
                className="w-8 h-8 flex items-center justify-center text-warmgray-500 dark:text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-300 active:bg-rose-50 dark:active:bg-rose-950/60 rounded-full transition"
                title="Reply"
              >
                <Reply className="w-4 h-4" />
              </button>

              {isMe && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditText(message.text);
                      setIsEditing(true);
                      setIsHovered(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-warmgray-500 dark:text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-300 active:bg-rose-50 dark:active:bg-rose-950/60 rounded-full transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(message.id);
                      setIsHovered(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-warmgray-500 dark:text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-300 active:bg-rose-50 dark:active:bg-rose-950/60 rounded-full transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Floating Reaction Picker */}
          {showReactionPicker && (
            <div
              className={`absolute top-0 transform -translate-y-full mb-1 flex items-center gap-1 bg-white dark:bg-[#221a2c] border border-rose-100 dark:border-rose-900/60 shadow-lg rounded-full px-2.5 py-1 z-30 ${
                isMe ? 'right-0' : 'left-0'
              }`}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(message.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  className="text-base p-1 hover:scale-130 transition transform"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => setShowReactionPicker(false)}
                className="p-1 text-warmgray-300 hover:text-warmgray-600 dark:hover:text-warmgray-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
