import React from 'react';
import { X, Shield, Server, Mic, Cpu, Lock } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#1C1917] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-[#FAFAF9]">Opal Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#FAFAF9] hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-sm text-[#A8A29E]">
          {/* Security Notice */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Secure Architecture</h3>
              <p className="text-xs text-[#FAFAF9]/90">
                The frontend never stores or handles Deepslate API credentials. All authentication and WebSocket relaying are routed securely through the server-side architecture.
              </p>
            </div>
          </div>

          {/* Configuration Placeholders */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-[#FAFAF9] uppercase tracking-wider">Audio & Protocol Configuration (Placeholders)</h3>
            
            <div className="space-y-2">
              <label className="text-xs text-[#A8A29E] block">Audio Sample Rate</label>
              <select
                disabled
                className="w-full bg-[#0C0A09] border border-stone-800 rounded-xl px-3 py-2 text-stone-400 opacity-60 cursor-not-allowed"
              >
                <option>24 kHz PCM (Deepslate Standard)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#A8A29E] block">WebSocket Relay Endpoint</label>
              <input
                type="text"
                disabled
                value="wss://api.deepslate.opal.relay (Configured server-side)"
                className="w-full bg-[#0C0A09] border border-stone-800 rounded-xl px-3 py-2 text-stone-400 opacity-60 cursor-not-allowed text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#A8A29E] block">Voice Activity Detection (VAD) Sensitivity</label>
              <input
                type="range"
                disabled
                className="w-full accent-emerald-500 opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="border-t border-stone-800 pt-4 text-xs text-stone-500">
            Foundation version 1.0.0. Ready for Cline voice engine extension.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-[#0C0A09] border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-stone-950 font-medium text-xs hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/10"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
