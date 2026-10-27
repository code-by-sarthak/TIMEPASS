'use client';

import React, { useEffect, useState } from 'react';
import { X, Camera, Mic, Volume2, Check } from 'lucide-react';

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceChange?: (kind: 'video' | 'audio', deviceId: string) => void;
}

export default function DeviceSettingsModal({
  isOpen,
  onClose,
  onDeviceChange,
}: DeviceSettingsModalProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedAudio, setSelectedAudio] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const v = devices.filter((d) => d.kind === 'videoinput');
        const a = devices.filter((d) => d.kind === 'audioinput');

        setVideoDevices(v);
        setAudioDevices(a);

        if (v.length > 0 && !selectedVideo) setSelectedVideo(v[0].deviceId);
        if (a.length > 0 && !selectedAudio) setSelectedAudio(a[0].deviceId);
      } catch (err) {
        console.warn('Enumerate devices error:', err);
      }
    }

    getDevices();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVideoSelect = (deviceId: string) => {
    setSelectedVideo(deviceId);
    if (onDeviceChange) onDeviceChange('video', deviceId);
  };

  const handleAudioSelect = (deviceId: string) => {
    setSelectedAudio(deviceId);
    if (onDeviceChange) onDeviceChange('audio', deviceId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl border border-white/10 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Audio & Video Settings</h3>
        <p className="text-xs text-gray-400 mb-6">Select your input hardware devices.</p>

        <div className="space-y-5">
          {/* Camera Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-2">
              <Camera className="w-4 h-4 text-brand-400" />
              <span>Camera Source</span>
            </label>
            <select
              value={selectedVideo}
              onChange={(e) => handleVideoSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              {videoDevices.length === 0 ? (
                <option value="">Default Web Camera</option>
              ) : (
                videoDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-dark-surface text-white">
                    {dev.label || `Camera ${idx + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Microphone Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-2">
              <Mic className="w-4 h-4 text-accent-purple" />
              <span>Microphone Source</span>
            </label>
            <select
              value={selectedAudio}
              onChange={(e) => handleAudioSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              {audioDevices.length === 0 ? (
                <option value="">Default Microphone</option>
              ) : (
                audioDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-dark-surface text-white">
                    {dev.label || `Microphone ${idx + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-400">
            Hardware switches apply immediately to your active media stream during your conversation.
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl gradient-button text-white text-xs font-bold shadow-md shadow-brand-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
