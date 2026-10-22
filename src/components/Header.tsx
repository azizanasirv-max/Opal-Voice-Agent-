import React from 'react';
import { ConnectionStatus } from '../types/voice';
import { Settings, Shield, Radio } from 'lucide-react';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  onOpenSettings: () => void;
  onToggleConnection: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  onOpenSettings,
  onToggleConnection,
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'connecting':
      case 'reconnecting':
        return 'bg-amber-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-stone-600';
    }
  };

  const getStatusLabel = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0C0A09]/90 backdrop-blur-md border-b border-stone-800">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
          <Radio className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-[#FAFAF9] tracking-tight">Opal Voice</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-xs text-[#A8A29E] capitalize">{getStatusLabel()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleConnection}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            connectionStatus === 'connected'
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
              : 'bg-emerald-500 text-stone-950 hover:bg-emerald-400 font-semibold shadow-lg shadow-emerald-500/20'
          }`}
        >
          {connectionStatus === 'connected' ? 'End Session' : 'Start Session'}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-[#1C1917] border border-stone-800 text-[#A8A29E] hover:text-[#FAFAF9] hover:border-stone-700 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
