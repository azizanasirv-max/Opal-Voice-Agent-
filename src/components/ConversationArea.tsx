import React, { useRef, useEffect, useState } from 'react';
import { ConversationMessage, ConversationStatus } from '../types/voice';
import { Bot, User, Info, Send, Sparkles } from 'lucide-react';

interface ConversationAreaProps {
  messages: ConversationMessage[];
  conversationStatus: ConversationStatus;
  isConnected: boolean;
  onSendTextMessage: (text: string) => void;
}

export const ConversationArea: React.FC<ConversationAreaProps> = ({
  messages,
  conversationStatus,
  isConnected,
  onSendTextMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversationStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isConnected) return;
    onSendTextMessage(inputText);
    setInputText('');
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0C0A09] relative">
      {/* Messages scroll container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-[#FAFAF9] mb-2">Welcome to Opal Voice</h2>
            <p className="text-sm text-[#A8A29E] mb-6">
              {isConnected
                ? 'Session active. Start speaking or send a test message below.'
                : 'Tap "Start Session" in the header to initialize the real-time voice foundation.'}
            </p>
            <div className="grid grid-cols-1 gap-2 w-full text-left">
              <div className="p-3 rounded-xl bg-[#1C1917] border border-stone-800 text-xs text-[#A8A29E]">
                <span className="text-emerald-400 font-medium block mb-0.5">Foundation Architecture</span>
                Designed for low-latency speech-to-speech streaming with Deepslate Opal.
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.speaker === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-xs text-[#A8A29E] max-w-lg text-center">
                    <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const isUser = msg.speaker === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-emerald-500 text-stone-950 font-bold text-xs'
                      : 'bg-[#1C1917] border border-stone-800 text-emerald-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-[#1C1917] border border-stone-800 text-[#FAFAF9] rounded-tl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                      isUser ? 'text-emerald-200' : 'text-[#A8A29E]'
                    }`}
                  >
                    <span>{formatTimestamp(msg.timestamp)}</span>
                    {msg.isInterrupted && <span className="italic">(interrupted)</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live status indicator bubble during processing/speaking */}
        {conversationStatus === 'processing' && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1C1917] border border-stone-800 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#1C1917] border border-stone-800 rounded-2xl rounded-tl-xs px-4 py-3 text-sm text-[#A8A29E] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Text fallback input bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#0C0A09]/95 backdrop-blur-md border-t border-stone-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isConnected ? 'Type message or use voice control...' : 'Connect session to chat...'}
            disabled={!isConnected}
            className="flex-1 bg-[#1C1917] border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-[#FAFAF9] placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputText.trim()}
            className="p-2.5 rounded-xl bg-emerald-500 text-stone-950 font-medium hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/10"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
