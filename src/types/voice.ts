export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export type ConversationStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export type SpeakerIdentity = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  speaker: SpeakerIdentity;
  text: string;
  timestamp: number;
  isInterrupted?: boolean;
}

export interface AppError {
  id: string;
  message: string;
  timestamp: number;
  code?: string;
}

export interface SessionDiagnostics {
  sessionDurationSeconds: number;
  firstAudioLatencyMs: number | null;
  interruptionResponseTimeMs: number | null;
  bytesTransferred: number;
}

export interface VoiceService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  startListening(): void;
  stopListening(): void;
  interrupt(): void;
  sendTextMessage(text: string): void;
  
  // Event subscriptions
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void;
  onConversationStatusChange(callback: (status: ConversationStatus) => void): () => void;
  onMessage(callback: (message: ConversationMessage) => void): () => void;
  onError(callback: (error: AppError) => void): () => void;
  onDiagnostics(callback: (diagnostics: SessionDiagnostics) => void): () => void;
}
