import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storage';
import { aiService } from '../../services/ai';
import type { ChatMessage, HabitAssessment } from '../../types/habit';
import { Send, User, Bot, RefreshCw } from 'lucide-react';

interface BehavioralCoachProps {
  assessment: HabitAssessment | null;
}

export const BehavioralCoach: React.FC<BehavioralCoachProps> = ({ assessment }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchChatHistory = async () => {
    if (!user) return;
    try {
      const history = await storageService.getChatHistory(user.uid);
      if (history.length === 0) {
        // Seed default therapist welcome message
        const welcome: ChatMessage = {
          id: `welcome_${Date.now()}`,
          sender: 'ai',
          text: `Hi there! I am Dr. Shift, your AI Behavioral Therapist. I have loaded your habit blueprint for "${assessment?.habitType || 'habit recovery'}". Tell me, how are you feeling today? Are you experiencing any triggers or stress?`,
          timestamp: new Date().toISOString()
        };
        setMessages([welcome]);
      } else {
        setMessages(history);
      }
    } catch (e) {
      console.error('Error fetching chat history:', e);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [user, assessment]);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputText.trim() || isTyping) return;

    const userMsgText = inputText.trim();
    setInputText('');

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toISOString()
    };

    // Update screen locally
    setMessages((prev) => [...prev, userMessage]);
    await storageService.saveChatMessage(user.uid, userMessage);

    // Call Gemini
    setIsTyping(true);
    try {
      // Structure historical thread format for Gemini SDK
      // Roles must alternate user/model
      const geminiHistory = messages
        .filter(m => m.id.startsWith('msg_') || m.id.startsWith('welcome_'))
        .map(m => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: m.text }]
        }));

      // Add the new user message to history
      geminiHistory.push({
        role: 'user',
        parts: [{ text: userMsgText }]
      });

      const aiResponseText = await aiService.getChatResponse(geminiHistory, userMsgText, assessment);

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, aiMessage]);
      await storageService.saveChatMessage(user.uid, aiMessage);
    } catch (e) {
      console.error('Error in chat:', e);
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'ai',
        text: "I apologize, my communication core experienced a minor delay. Let's try again. What were we discussing?",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = async () => {
    if (!user) return;
    if (window.confirm("Are you sure you want to clear chat history with Dr. Shift?")) {
      // Quick way to clear local storage chat key
      localStorage.removeItem(`mindshift_chat_${user.uid}`);
      const welcome: ChatMessage = {
        id: `welcome_${Date.now()}`,
        sender: 'ai',
        text: `Hi there! Let's start fresh. I am Dr. Shift, your AI Coach. How can I help you support your behavioral change goals today?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcome]);
    }
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800 h-[600px] flex flex-col justify-between overflow-hidden relative">
      {/* Chat header */}
      <div className="border-b border-slate-800 bg-slate-900/60 py-4 px-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bot className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Dr. Shift</h3>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active CBT Coach
            </span>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-800 bg-slate-950/20"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Clear History
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20 scrollbar-thin">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-[85%] ${
              m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            } animate-fadeIn`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full border flex-shrink-0 flex items-center justify-center ${
              m.sender === 'user' 
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed border shadow-md ${
              m.sender === 'user'
                ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 rounded-tr-none'
                : 'bg-slate-900/60 border-slate-800 text-slate-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              <span className="text-[9px] text-slate-500 block mt-1 text-right">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[85%] mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex-shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2 relative z-10">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Dr. Shift about cravings, replacement activities, or stress..."
          className="glass-input flex-1 focus:ring-emerald-500/20 focus:border-emerald-500/40 font-normal"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={isTyping || !inputText.trim()}
          className="glass-button-primary p-3 rounded-lg shadow-md flex-shrink-0 hover:shadow-emerald-500/10 disabled:opacity-50 disabled:scale-100"
        >
          <Send className="w-4.5 h-4.5 text-slate-950" />
        </button>
      </form>
    </div>
  );
};
export default BehavioralCoach;
