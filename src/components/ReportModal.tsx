'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Ban, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  partnerName: string;
  onSubmitReport: (reason: string, details: string, blockUser: boolean) => void;
}

const REPORT_REASONS = [
  'Inappropriate or explicit video/nudity',
  'Harassment, hate speech, or verbal abuse',
  'Spam, advertising, or automated bot',
  'Suspected underage user (< 18)',
  'Dangerous activity or threats of violence',
  'Other violation of Community Guidelines'
];

export default function ReportModal({
  isOpen,
  onClose,
  partnerName,
  onSubmitReport,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedReason, details, blockUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl border border-red-500/20 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Report {partnerName}</h3>
            <p className="text-xs text-gray-400">Help keep TIMEPASS safe and respectful.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Reason for Report
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                    selectedReason === reason
                      ? 'bg-red-500/10 border-red-500/40 text-white font-medium'
                      : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-red-500 focus:ring-0"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide any specific context to assist moderators..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer p-2.5 rounded-xl bg-white/5 border border-white/5">
            <input
              type="checkbox"
              checked={blockUser}
              onChange={(e) => setBlockUser(e.target.checked)}
              className="rounded text-red-500 focus:ring-0"
            />
            <div className="flex items-center gap-1.5 font-medium">
              <Ban className="w-3.5 h-3.5 text-red-400" />
              <span>Block this user immediately (prevents future matching)</span>
            </div>
          </label>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30"
            >
              Submit Report & Disconnect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
