import React from 'react';
import { ConversationStatus, ConnectionStatus } from '../types/voice';
import { Mic, MicOff, Volume2, Square, Zap } from 'lucide-react';

interface VoiceControlProps {
  connectionStatus: ConnectionStatus;
  conversationStatus: ConversationStatus;
  onStartListening: () => void;
  onStopListening: () => void;
  onInterrupt: () => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  connectionStatus,
  conversationStatus,
  onStartListening,
  onStopListening,
  onInterrupt,
}) => {
  const isConnected = connectionStatus === 'connected';

  const handleMicClick = () => {
    if (!isConnected) return;
    if (conversationStatus === 'listening') {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const getMicButtonStyles = () => {
    if (!isConnected) {
      return 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed';
    }
    switch (conversationStatus) {
      case 'listening':
        return 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-pulse';
      case 'speaking':
        return 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]';
      case 'processing':
        return 'bg-stone-800 border-emerald-500/50 text-emerald-400 animate-spin';
      default:
        return 'bg-[#1C1917] border-stone-700 text-emerald-400 hover:border-emerald-500 hover:bg-stone-800 shadow-xl';
    }
  };

  const getStatusLabel = () => {
    if (!isConnected) return 'Session Disconnected';
    switch (conversationStatus) {
      case 'listening':
        return 'Listening... (Tap to stop)';
      case 'speaking':
        return 'Assistant Speaking (Tap to interrupt)';
      case 'processing':
        return 'Processing speech...';
      default:
        return 'Tap microphone to speak';
    }
  };

  return (
    <div className="absolute bottom-16 left-0 right-0 z-20 flex flex-col items-center pointer-events-none pb-2">
      {/* Floating control capsule */}
      <div className="flex items-center gap-4 bg-[#0C0A09]/90 backdrop-blur-md px-6 py-3 rounded-full border border-stone-800 shadow-2xl pointer-events-auto">
        {/* Interrupt / Stop button when speaking */}
        {conversationStatus === 'speaking' && (
          <button
            onClick={onInterrupt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
            title="Interrupt Assistant (Barge-in)"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Interrupt</span>
          </button>
        )}

        {/* Main Microphone Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleMicClick}
            disabled={!isConnected}
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${getMicButtonStyles()}`}
            aria-label={conversationStatus === 'listening' ? 'Stop listening' : 'Start listening'}
          >
            {conversationStatus === 'listening' ? (
              <Mic className="w-6 h-6" />
            ) : conversationStatus === 'speaking' ? (
              <Volume2 className="w-6 h-6 animate-bounce" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Status prompt */}
        <div className="text-left hidden sm:block">
          <div className="text-xs font-medium text-[#FAFAF9] flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-stone-600'}`} />
            <span className="capitalize">{conversationStatus}</span>
          </div>
          <p className="text-[11px] text-[#A8A29E]">{getStatusLabel()}</p>
        </div>
      </div>
    </div>
  );
};
