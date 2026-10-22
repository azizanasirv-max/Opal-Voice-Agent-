import {
  ConnectionStatus,
  ConversationStatus,
  ConversationMessage,
  AppError,
  SessionDiagnostics,
  VoiceService,
} from '../types/voice';

/**
 * Placeholder implementation of VoiceService for the Opal Voice foundation stage.
 * Awaiting Cline implementation of the actual Deepslate WebSocket protocol and audio engine.
 */
export class VoiceServiceMock implements VoiceService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private conversationStatus: ConversationStatus = 'idle';
  private diagnostics: SessionDiagnostics = {
    sessionDurationSeconds: 0,
    firstAudioLatencyMs: null,
    interruptionResponseTimeMs: null,
    bytesTransferred: 0,
  };

  private connectionListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private conversationListeners: Set<(status: ConversationStatus) => void> = new Set();
  private messageListeners: Set<(msg: ConversationMessage) => void> = new Set();
  private errorListeners: Set<(err: AppError) => void> = new Set();
  private diagnosticsListeners: Set<(diag: SessionDiagnostics) => void> = new Set();

  private timerInterval: any = null;

  async connect(): Promise<void> {
    this.setConnectionStatus('connecting');
    
    // Simulate connection handshake delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    this.setConnectionStatus('connected');
    this.setConversationStatus('idle');
    this.startDiagnosticsTimer();

    this.addSystemMessage(
      'Connected to Opal Voice Foundation. Awaiting Deepslate real-time voice protocol implementation by Cline.'
    );
  }

  async disconnect(): Promise<void> {
    this.stopDiagnosticsTimer();
    this.setConnectionStatus('disconnected');
    this.setConversationStatus('idle');
    this.addSystemMessage('Disconnected from session.');
  }

  startListening(): void {
    if (this.connectionStatus !== 'connected') return;
    this.setConversationStatus('listening');
    
    // In foundation mode, we don't stream audio. We simulate transitioning back to idle or processing after a moment if desired, 
    // or keep it in listening until stopped. Let's toggle to listening state.
  }

  stopListening(): void {
    if (this.connectionStatus !== 'connected') return;
    this.setConversationStatus('idle');
  }

  interrupt(): void {
    if (this.connectionStatus !== 'connected') return;
    this.setConversationStatus('idle');
    this.addSystemMessage('User interruption triggered (playback cancelled).');
  }

  sendTextMessage(text: string): void {
    if (!text.trim()) return;

    const userMsg: ConversationMessage = {
      id: 'msg-' + Date.now(),
      speaker: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    this.notifyMessage(userMsg);

    // Placeholder assistant response acknowledging foundation mode
    setTimeout(() => {
      const assistantMsg: ConversationMessage = {
        id: 'msg-asst-' + Date.now(),
        speaker: 'assistant',
        text: `[Foundation Placeholder] Received: "${text}". Real-time AI response will be handled by Deepslate Opal protocol.`,
        timestamp: Date.now(),
      };
      this.notifyMessage(assistantMsg);
      this.setConversationStatus('idle');
    }, 600);

    this.setConversationStatus('processing');
  }

  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.add(callback);
    callback(this.connectionStatus);
    return () => this.connectionListeners.delete(callback);
  }

  onConversationStatusChange(callback: (status: ConversationStatus) => void): () => void {
    this.conversationListeners.add(callback);
    callback(this.conversationStatus);
    return () => this.conversationListeners.delete(callback);
  }

  onMessage(callback: (message: ConversationMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onError(callback: (error: AppError) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  onDiagnostics(callback: (diagnostics: SessionDiagnostics) => void): () => void {
    this.diagnosticsListeners.add(callback);
    callback(this.diagnostics);
    return () => this.diagnosticsListeners.delete(callback);
  }

  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.connectionListeners.forEach((cb) => cb(status));
  }

  private setConversationStatus(status: ConversationStatus) {
    this.conversationStatus = status;
    this.conversationListeners.forEach((cb) => cb(status));
  }

  private addSystemMessage(text: string) {
    const sysMsg: ConversationMessage = {
      id: 'sys-' + Date.now(),
      speaker: 'system',
      text,
      timestamp: Date.now(),
    };
    this.notifyMessage(sysMsg);
  }

  private notifyMessage(msg: ConversationMessage) {
    this.messageListeners.forEach((cb) => cb(msg));
  }

  private startDiagnosticsTimer() {
    this.stopDiagnosticsTimer();
    const startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      this.diagnostics = {
        ...this.diagnostics,
        sessionDurationSeconds: duration,
      };
      this.diagnosticsListeners.forEach((cb) => cb(this.diagnostics));
    }, 1000);
  }

  private stopDiagnosticsTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

export const voiceService = new VoiceServiceMock();
