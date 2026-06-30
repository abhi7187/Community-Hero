import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, User, HelpCircle, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface AIChatBotProps {
  currentUserId?: string;
  userName?: string;
}

export default function AIChatBot({ currentUserId, userName = 'Citizen' }: AIChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `Hello ${userName}! I am your Community Hero AI Civic Assistant. I have live access to our neighborhood reports. Ask me questions like:
- "What is the status of the deep pothole on Market St?"
- "Why is my complaint delayed?"
- "How do I make a highly effective civic report?"`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (!textToSend) setInput('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', text: query } as ChatMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: updatedMessages.slice(-5) // Send last few messages as context
        })
      });

      const data = await response.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
      } else {
        throw new Error('No response field');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'I ran into a connection anomaly while querying municipal databases. Let me attempt a local status override: Most high-severity issues are actively assigned. What can I help check for you?' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestPrompts = [
    'Check pothole status #iss-1',
    'How do I earn Road Warrior badge?',
    'How does duplicate detection work?',
    'What happens when I verify an issue?'
  ];

  return (
    <div className="flex flex-col h-[500px] bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              AI Civic Advisor
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">LIVE</span>
            </h3>
            <p className="text-[10px] text-slate-400">Context-aware municipal support</p>
          </div>
        </div>
        <MessageSquare className="w-4.5 h-4.5 text-slate-500" />
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 text-emerald-400'
            }`}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            
            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-950 border border-slate-800/80 text-slate-200 rounded-tl-none'
            }`}>
              {msg.text.split('\n').map((line, lIdx) => (
                <p key={lIdx} className={lIdx > 0 ? 'mt-1' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850/80 rounded-tl-none">
              <div className="flex space-x-1.5 items-center py-1">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested chips */}
      <div className="p-3 bg-slate-950/40 border-t border-slate-850 overflow-x-auto flex gap-2 scrollbar-none shrink-0">
        {suggestPrompts.map((prompt, pIdx) => (
          <button
            key={pIdx}
            className="shrink-0 bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40 hover:border-slate-700 px-3 py-1 rounded-full text-[10px] transition-colors font-medium cursor-pointer"
            onClick={() => handleSend(prompt)}
            disabled={loading}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Ask a question about local reports..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
