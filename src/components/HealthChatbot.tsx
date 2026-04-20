import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

import { generateAIContent } from '../lib/gemini';

export default function HealthChatbot() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: "Hello! I'm your PhysioScan Health Assistant. How can I help you today? You can ask me about symptoms, wellness tips, or general health questions.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for context (last 5 messages)
      const history = messages.slice(-5).map(m => ({ role: m.role, text: m.text }));

      const historyContext = history.length > 0
        ? `Previous conversation:\n${history.map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n')}\n`
        : '';

      const prompt = `
${historyContext}
User Message: "${userMessage.text}"
Language: ${language === 'hi' ? 'Hindi' : 'English'}

You are PhysioScan AI's Health Chatbot.
- You are a knowledgeable, empathetic, and helpful AI health assistant.
- Answer general health questions, explain medical terms, provide wellness tips, and discuss symptoms in a conversational manner.
- If the user asks for a diagnosis, remind them you are an AI and they should see a doctor, but provide general information about the symptoms.
- You can provide more detailed answers than the voice assistant, but keep it readable and structured.
- Use Ayurvedic knowledge where appropriate.
- Be polite and professional.

Respond in ${language === 'hi' ? 'Hindi' : 'English'}.
`;

      const aiResponse = await generateAIContent(prompt);
      
      let responseText = "I'm sorry, I couldn't generate a response. Please try asking in a different way.";
      
      if (aiResponse && aiResponse.text) {
        responseText = aiResponse.text;
      } else if (aiResponse && aiResponse.candidates && aiResponse.candidates.length > 0) {
        const candidate = aiResponse.candidates[0];
        if (candidate.finishReason !== 'STOP') {
          responseText = `I couldn't complete the response due to: ${candidate.finishReason}. Please try again.`;
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: "I'm sorry, I encountered an error connecting to the AI. Please check your connection and try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between border-b border-blue-700/50">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg tracking-wide">Health Assistant</h3>
            <p className="text-blue-100 text-xs font-medium opacity-90">Always here to help</p>
          </div>
        </div>
        <div className="bg-white/10 px-3 py-1.5 rounded-full text-xs text-white font-bold border border-white/20 flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-200" />
          AI Powered
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-600/20'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-slate-200/50'
              }`}
            >
              {message.role === 'ai' ? (
                <div className="prose prose-sm prose-blue max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-700">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-[15px] leading-relaxed">{message.text}</p>
              )}
              <p
                className={`text-[10px] mt-2 font-medium text-right ${
                  message.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
        
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a health question..."
            className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50 hover:bg-white text-[15px]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] flex-shrink-0 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-center text-slate-400 mt-3 font-medium">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
