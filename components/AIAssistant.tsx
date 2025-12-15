import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: 'أهلاً بك يا عالم المستقبل! 👋 أنا مساعدك الذكي. اسألني عن الدوائر الكهربائية أو C# أو أي شيء عالق في ذهنك!',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await sendMessageToGemini(history, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 h-96 bg-electro-dark border border-electro-primary/50 rounded-2xl shadow-2xl shadow-electro-primary/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-electro-primary p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white font-bold">
              <Bot className="w-5 h-5" />
              <span>المساعد الذكي</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-electro-secondary text-white self-end mr-auto rounded-tr-none'
                    : 'bg-electro-accent/20 text-electro-text self-start ml-auto rounded-tl-none border border-electro-accent/30'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="self-start ml-auto bg-electro-accent/10 p-2 rounded-lg">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-electro-accent rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-electro-accent rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-electro-accent rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-electro-primary/30 bg-black/20 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب سؤالك هنا..."
              className="flex-1 bg-black/40 border border-electro-primary/40 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-electro-accent text-right"
              dir="rtl"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-electro-primary hover:bg-electro-secondary text-white p-2 rounded-full disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 transform rotate-180" /> {/* Rotated for RTL feel */}
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-electro-primary to-electro-secondary rounded-full shadow-lg shadow-electro-primary/40 hover:scale-110 transition-transform duration-200"
      >
        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75 group-hover:opacity-100"></span>
        {isOpen ? <X className="w-8 h-8 text-white relative z-10" /> : <MessageCircle className="w-8 h-8 text-white relative z-10" />}
      </button>
    </div>
  );
};
