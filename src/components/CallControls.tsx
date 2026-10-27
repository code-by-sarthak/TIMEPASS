'use client';

import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  SkipForward, 
  PhoneOff, 
  MessageSquare, 
  ShieldAlert,
  Settings
} from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isFullscreen: boolean;
  isChatOpen: boolean;
  unreadCount?: number;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onToggleFullscreen: () => void;
  onToggleChat: () => void;
  onNext: () => void;
  onEndCall: () => void;
  onOpenReport: () => void;
  onOpenSettings?: () => void;
}

export default function CallControls({
  isMuted,
  isVideoOff,
  isFullscreen,
  isChatOpen,
  unreadCount = 0,
  onToggleMic,
  onToggleVideo,
  onSwitchCamera,
  onToggleFullscreen,
  onToggleChat,
  onNext,
  onEndCall,
  onOpenReport,
  onOpenSettings,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 p-3 glass-toolbar rounded-2xl max-w-fit mx-auto transition-all">
      {/* Microphone Toggle */}
      <button
        onClick={onToggleMic}
        className={`p-3 rounded-xl transition-all ${
          isMuted
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
        }`}
        title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-xl transition-all ${
          isVideoOff
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
        }`}
        title={isVideoOff ? 'Turn Video On' : 'Pause Video'}
      >
        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      {/* Switch Camera */}
      <button
        onClick={onSwitchCamera}
        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all"
        title="Switch Camera (Front/Back)"
      >
        <RotateCw className="w-5 h-5" />
      </button>

      {/* NEXT BUTTON - Primary Action */}
      <button
        onClick={onNext}
        className="px-6 py-3 rounded-xl gradient-button text-white font-bold flex items-center gap-2 shadow-lg shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
        title="Skip to Next Person (or press Esc)"
      >
        <span>NEXT</span>
        <SkipForward className="w-5 h-5 fill-current" />
      </button>

      {/* Chat Drawer Toggle */}
      <button
        onClick={onToggleChat}
        className={`relative p-3 rounded-xl transition-all ${
          isChatOpen
            ? 'bg-brand-500 text-white shadow'
            : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
        }`}
        title="Toggle Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && !isChatOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={onToggleFullscreen}
        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all hidden sm:block"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      {/* Settings Modal Toggle */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all hidden sm:block"
          title="Audio/Video Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {/* Report & Block */}
      <button
        onClick={onOpenReport}
        className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
        title="Report or Block User"
      >
        <ShieldAlert className="w-5 h-5" />
      </button>

      {/* END CALL BUTTON */}
      <button
        onClick={onEndCall}
        className="p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-600/30"
        title="Leave and End Call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  );
}
