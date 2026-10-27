'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Copy, Check, X, Sparkles, MessageCircle } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import { soundManager } from '@/lib/sound';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isPartnerTyping?: boolean;
  onTyping?: (isTyping: boolean) => void;
  sharedInterests?: string[];
  partnerName?: string;
}

const COMMON_EMOJIS = ['👋', '😊', '😂', '🔥', '❤️', '🎉', '✨', '👍', '🍕', '🎮', '💡', '🚀'];

export default function ChatDrawer({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isPartnerTyping = false,
  onTyping,
  sharedInterests = [],
  partnerName = 'Stranger',
}: ChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
    if (onTyping) onTyping(false);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-dark-card/95 backdrop-blur-xl border-l border-white/10 w-full sm:w-80 md:w-96 shadow-2xl relative transition-all">
      {/* Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Conversation with {partnerName}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shared Interests Banner */}
      {sharedInterests.length > 0 && (
        <div className="px-3 py-2 bg-brand-500/10 border-b border-brand-500/20 text-xs text-brand-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <div className="truncate">
            <span className="font-semibold">Common interests:</span> {sharedInterests.join(', ')}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs px-4">
            <p>Say hello to {partnerName}! 👋</p>
            <p className="text-[10px] text-gray-400 mt-1">Remember to be respectful and follow Community Guidelines.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col group ${msg.isSelf ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] text-gray-400 font-medium">
                  {msg.isSelf ? 'You' : msg.senderName}
                </span>
                <span className="text-[9px] text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="relative flex items-center gap-1.5">
                <div
                  className={`px-3 py-2 rounded-2xl text-xs max-w-[260px] break-words shadow-sm ${
                    msg.isSelf
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Copy button */}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-opacity"
                  title="Copy message"
                >
                  {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))
        )}

        {/* Partner Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-brand-400" />
            <span>{partnerName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="p-2 border-t border-white/10 bg-dark-surface grid grid-cols-6 gap-1 animate-in slide-in-from-bottom-2">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="text-lg p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Field */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Pick Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-brand-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl gradient-button text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
