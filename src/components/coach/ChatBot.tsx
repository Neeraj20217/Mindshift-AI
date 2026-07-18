import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Trash2, Loader } from 'lucide-react';
import { aiService } from '../../services/ai';
import { useAuth } from '../../contexts/AuthContext';
import type { HabitAssessment } from '../../types/habit';

interface ChatBotProps {
  assessment: HabitAssessment | null;
}

interface QuickMessage {
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ assessment }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'model',
          text: `Hi! I'm Dr. Shift, your AI Habit Assistant. Experiencing a sudden trigger or craving? Ask me for a quick 2-minute redirection trick or coping advice!`
        }
      ]);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = inputText.trim();
    if (!cleanMsg || isLoading) return;

    // Append user message
    const updatedMessages = [...messages, { role: 'user', text: cleanMsg } as QuickMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Structure historical thread format for Gemini SDK
      const geminiHistory = updatedMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await aiService.getChatResponse(geminiHistory, cleanMsg, assessment);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an error checking in. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'model',
        text: "Conversation reset. What craving or trigger can we tackle together right now?"
      }
    ]);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 font-sans">
      
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="toggle-chatbot-btn"
          aria-label="Open AI habit assistant"
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all transform hover:-translate-y-1 hover:scale-105 border border-emerald-400/20 active:scale-95"
        >
          <MessageSquare className="h-6 w-6 text-slate-950 font-bold" />
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          id="ai-chatbot-window"
          className="w-[350px] sm:w-[380px] h-[480px] rounded-2xl glass-panel shadow-2xl border border-slate-800 overflow-hidden flex flex-col animate-fadeIn"
        >
          
          {/* Header */}
          <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-sm text-slate-100">Dr. Shift Quick Assistant</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900/40"
                title="Reset Chat History"
                aria-label="Reset chat history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900/40"
                aria-label="Close chatbot assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#090d16]/30">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-tr from-emerald-500/20 to-emerald-600/15 border border-emerald-500/30 text-emerald-100 rounded-br-none'
                      : 'bg-slate-900/60 border border-slate-800/60 text-slate-300 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                  <Loader className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>Dr. Shift is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-950/80 border-t border-slate-900 flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-grow glass-input rounded-xl px-4 py-2.5 text-xs disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-3.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-600 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="h-4 w-4 text-slate-950 fill-slate-950" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
