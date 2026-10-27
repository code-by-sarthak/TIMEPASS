'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  MessageSquare, 
  Send, 
  Smile, 
  SkipForward, 
  PhoneOff, 
  ShieldAlert, 
  Copy, 
  Check, 
  Home, 
  Sparkles, 
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getSocket } from '@/lib/socket';
import { soundManager } from '@/lib/sound';
import { ChatMessage, MatchPartner } from '@/lib/types';
import ReportModal from '@/components/ReportModal';
import MatchingRadar from '@/components/MatchingRadar';

const COMMON_EMOJIS = ['👋', '😊', '😂', '🔥', '❤️', '🎉', '✨', '👍', '🍕', '🎮', '💡', '🚀'];

function TextChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [status, setStatus] = useState<'idle' | 'searching' | 'connected' | 'disconnected'>('idle');
  const [partner, setPartner] = useState<MatchPartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [friendAdded, setFriendAdded] = useState(false);

  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];
  const language = searchParams.get('language') || 'English';
  const country = searchParams.get('country') || 'Global (Any)';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const partnerIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const startTextSession = useCallback(() => {
    setStatus('searching');
    setPartner(null);
    setMessages([]);

    const socket = getSocket(user?.id, user?.displayName);
    socket.emit('join-queue', {
      mode: 'text',
      interests,
      languages: [language],
      country,
      gender: user?.profile?.gender,
      region: user?.profile?.region,
      userId: user?.id,
      displayName: user?.displayName,
      avatarUrl: user?.avatarUrl,
      previousPartnerId: partnerIdRef.current || undefined,
    });
  }, [user, interests, language, country]);

  useEffect(() => {
    startTextSession();
  }, [startTextSession]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('match-found', (data: { roomId: string; partner: MatchPartner }) => {
      setPartner(data.partner);
      partnerIdRef.current = data.partner.id;
      setStatus('connected');
      setMessages([]);
      setFriendAdded(false);
      soundManager.playMatchFound();

      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#a855f7', '#6366f1', '#ec4899']
        });
      } catch {
        // Fallback
      }
    });

    socket.on('receive-message', (data: { id: string; senderId: string; senderName: string; content: string; timestamp: string }) => {
      setMessages((prev) => [...prev, { ...data, isSelf: false }]);
      soundManager.playMessagePing();
    });

    socket.on('message-sent', (data: { id: string; senderId: string; senderName: string; content: string; timestamp: string }) => {
      setMessages((prev) => [...prev, { ...data, isSelf: true }]);
    });

    socket.on('partner-typing', (data: { isTyping: boolean }) => {
      setIsPartnerTyping(data.isTyping);
    });

    socket.on('partner-left', () => {
      soundManager.playDisconnect();
      setStatus('disconnected');
    });

    socket.on('trigger-requeue', (data: { previousPartnerId?: string }) => {
      if (data.previousPartnerId) {
        partnerIdRef.current = data.previousPartnerId;
      }
      startTextSession();
    });

    return () => {
      socket.off('match-found');
      socket.off('receive-message');
      socket.off('message-sent');
      socket.off('partner-typing');
      socket.off('partner-left');
      socket.off('trigger-requeue');
    };
  }, [startTextSession]);

  const handleNext = () => {
    soundManager.playDisconnect();
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('call-next', {
        interests,
        languages: [language],
        country
      });
    }
    setPartner(null);
    setStatus('searching');
  };

  const handleEndChat = () => {
    soundManager.playDisconnect();
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('call-end');
    }
    router.push('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    const socket = getSocket();
    socket.emit('typing', { isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { isTyping: false });
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const socket = getSocket();
    socket.emit('send-message', { content: inputText.trim() });
    setInputText('');
    setShowEmojiPicker(false);
    socket.emit('typing', { isTyping: false });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitReport = (reason: string, details: string) => {
    if (!partner) return;
    const socket = getSocket();
    socket.emit('report-user', {
      reportedUserId: partner.id,
      reason,
      details,
    });
    handleNext();
  };

  return (
    <div className="relative w-screen h-screen bg-dark-surface overflow-hidden flex flex-col">
      {/* Top Header */}
      <header className="px-4 py-3 glass-panel border-b border-white/10 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
            title="Return to Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white">TIME</span>
              <span className="font-extrabold text-sm tracking-wider gradient-text">PASS</span>
              <span className="text-xs text-gray-400 font-normal">· Text Chat</span>
            </div>
            {partner && status === 'connected' && (
              <p className="text-[10px] text-gray-400">
                Connected with <strong className="text-pink-300">{partner.displayName}</strong>
                {partner.gender && partner.gender !== 'Not Specified' && ` (${partner.gender})`}
                {partner.region ? ` · 📍 ${partner.region.split('(')[0].trim()}` : ` · 📍 ${partner.country}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {partner && status === 'connected' && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1 border border-red-500/20"
              title="Report or Block"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-xl gradient-button text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <span>NEXT</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleEndChat}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            title="Leave Chat"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Chat Body */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto relative overflow-hidden">
        {/* Searching Radar */}
        {status === 'searching' && (
          <div className="flex-1 flex items-center justify-center">
            <MatchingRadar
              mode="text"
              interests={interests}
              onCancel={() => router.push('/')}
            />
          </div>
        )}

        {/* Partner Disconnected Notice */}
        {status === 'disconnected' && (
          <div className="m-4 p-4 glass-panel rounded-2xl border border-white/10 text-center animate-in fade-in">
            <p className="text-sm font-semibold text-white mb-1">Stranger has disconnected.</p>
            <p className="text-xs text-gray-400 mb-4">Would you like to start talking with someone new?</p>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl gradient-button text-white text-xs font-bold inline-flex items-center gap-2"
            >
              <span>Find Next Person</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Connected Chat Messages Area */}
        {status === 'connected' && (
          <>
            {/* Shared Interests Banner */}
            {partner?.sharedInterests && partner.sharedInterests.length > 0 && (
              <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>You both love: <strong>{partner.sharedInterests.join(', ')}</strong></span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs">
                  <p className="text-sm text-white font-semibold mb-1">Connected with a random stranger! 🎉</p>
                  <p className="text-gray-400">Say hello and start the conversation. Keep it respectful.</p>
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
                        className={`px-4 py-2.5 rounded-2xl text-xs max-w-md break-words shadow-sm ${
                          msg.isSelf
                            ? 'bg-brand-600 text-white rounded-tr-none'
                            : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                        }`}
                      >
                        {msg.content}
                      </div>

                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-opacity"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))
              )}

              {isPartnerTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-brand-400" />
                  <span>{partner?.displayName || 'Stranger'} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div className="mx-4 p-2 border border-white/10 glass-panel rounded-xl grid grid-cols-6 sm:grid-cols-12 gap-1 animate-in slide-in-from-bottom-2">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInputText((prev) => prev + emoji)}
                    className="text-lg p-1.5 hover:bg-white/10 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-dark-card flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Pick Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder="Type your message here..."
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-brand-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl gradient-button text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Report Modal */}
      {partner && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportedUserId={partner.id}
          partnerName={partner.displayName}
          onSubmitReport={handleSubmitReport}
        />
      )}
    </div>
  );
}

export default function TextChatPage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen bg-dark-surface flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Loading TIMEPASS Text Chat...</p>
        </div>
      </div>
    }>
      <TextChatContent />
    </Suspense>
  );
}
