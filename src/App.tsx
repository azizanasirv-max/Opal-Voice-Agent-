import React, { useState, useEffect } from 'react';
import {
  ConnectionStatus,
  ConversationStatus,
  ConversationMessage,
  SessionDiagnostics,
} from './types/voice';
import { voiceService } from './services/VoiceServiceMock';
import { Header } from './components/Header';
import { ConversationArea } from './components/ConversationArea';
import { VoiceControl } from './components/VoiceControl';
import { DiagnosticsBar } from './components/DiagnosticsBar';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus>('idle');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [diagnostics, setDiagnostics] = useState<SessionDiagnostics>({
    sessionDurationSeconds: 0,
    firstAudioLatencyMs: null,
    interruptionResponseTimeMs: null,
    bytesTransferred: 0,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const unsubConn = voiceService.onConnectionChange(setConnectionStatus);
    const unsubConv = voiceService.onConversationStatusChange(setConversationStatus);
    const unsubMsg = voiceService.onMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    const unsubDiag = voiceService.onDiagnostics(setDiagnostics);

    return () => {
      unsubConn();
      unsubConv();
      unsubMsg();
      unsubDiag();
    };
  }, []);

  const handleToggleConnection = async () => {
    if (connectionStatus === 'connected') {
      await voiceService.disconnect();
    } else {
      await voiceService.connect();
    }
  };

  const handleStartListening = () => {
    voiceService.startListening();
  };

  const handleStopListening = () => {
    voiceService.stopListening();
  };

  const handleInterrupt = () => {
    voiceService.interrupt();
  };

  const handleSendTextMessage = (text: string) => {
    voiceService.sendTextMessage(text);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0C0A09] text-[#FAFAF9] font-sans select-none">
      {/* Header */}
      <Header
        connectionStatus={connectionStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleConnection={handleToggleConnection}
      />

      {/* Main Conversation & Control Space */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Diagnostics Bar */}
        <DiagnosticsBar
          diagnostics={diagnostics}
          connectionStatus={connectionStatus}
        />

        {/* Conversation Message Stream */}
        <ConversationArea
          messages={messages}
          conversationStatus={conversationStatus}
          isConnected={connectionStatus === 'connected'}
          onSendTextMessage={handleSendTextMessage}
        />

        {/* Floating Voice Control Capsule */}
        <VoiceControl
          connectionStatus={connectionStatus}
          conversationStatus={conversationStatus}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          onInterrupt={handleInterrupt}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
