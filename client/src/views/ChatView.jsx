import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import {
  MessageSquare, Send, Loader2, Bot, User
} from 'lucide-react';

export default function ChatView() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm IM-Nexus — your intelligent workspace hub. I have access to your Gmail, Calendar, Drive, Tasks, Contacts, and Chat spaces. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMsgs = [...messages, { role: 'user', text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const data = await api.post('/api/chat', { message: text, history: messages });
      setMessages([...newMsgs, { role: 'ai', text: data.response || 'No response received.' }]);
    } catch {
      setMessages([...newMsgs, { role: 'ai', text: '❌ Failed to reach server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Summarize my emails from today",
    "What meetings do I have this week?",
    "Show my pending tasks",
    "Find recent Drive files",
  ];

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="section-header">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f97316,#e11d48)' }}>
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="section-title">Ask Anything</h2>
          <p style={{ fontSize: 12, color: '#71717a', marginTop: 1 }}>AI with full Workspace context</p>
        </div>
      </div>

      <div className="glass flex flex-col flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(99,102,241,0.2)' }}>
                    <Bot className="w-4 h-4" style={{ color: '#818cf8' }} />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-3 text-sm ${m.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                  <div className="md"><ReactMarkdown>{m.text}</ReactMarkdown></div>
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                <Bot className="w-4 h-4" style={{ color: '#818cf8' }} />
              </div>
              <div className="bubble-ai px-4 py-3 flex gap-1 items-center">
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex gap-3">
            <input
              className="field flex-1"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about your emails, meetings, files, tasks..."
            />
            <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
