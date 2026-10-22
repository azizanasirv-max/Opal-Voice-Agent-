import React, { useState } from 'react';
import { SessionDiagnostics, ConnectionStatus } from '../types/voice';
import { Activity, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react';

interface DiagnosticsBarProps {
  diagnostics: SessionDiagnostics;
  connectionStatus: ConnectionStatus;
}

export const DiagnosticsBar: React.FC<DiagnosticsBarProps> = ({
  diagnostics,
  connectionStatus,
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute top-14 left-4 z-20">
      <div className="bg-[#1C1917]/90 backdrop-blur-md border border-stone-800 rounded-xl shadow-lg text-xs text-[#A8A29E] overflow-hidden transition-all">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-stone-800/50 w-full text-left"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[#FAFAF9]">Diagnostics</span>
          <span className="text-stone-500">|</span>
          <span>{formatDuration(diagnostics.sessionDurationSeconds)}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
        </button>

        {expanded && (
          <div className="px-3 py-2.5 border-t border-stone-800 space-y-1.5 bg-[#0C0A09]/50 min-w-[200px]">
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className="text-[#FAFAF9] capitalize">{connectionStatus}</span>
            </div>
            <div className="flex justify-between">
              <span>First-Audio Latency:</span>
              <span className="text-stone-500 italic">
                {diagnostics.firstAudioLatencyMs !== null ? `${diagnostics.firstAudioLatencyMs} ms` : 'Unavailable'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Interruption Response:</span>
              <span className="text-stone-500 italic">
                {diagnostics.interruptionResponseTimeMs !== null ? `${diagnostics.interruptionResponseTimeMs} ms` : 'Unavailable'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bytes Transferred:</span>
              <span className="text-[#FAFAF9]">{diagnostics.bytesTransferred} B</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
