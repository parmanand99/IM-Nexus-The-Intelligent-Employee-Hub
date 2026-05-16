import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import { Mail, RefreshCw, Loader2, Sparkles } from 'lucide-react';

function EmailCard({ email, idx }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      className="glass glass-hover p-4 cursor-default">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm font-semibold text-zinc-100 leading-snug">{email.subject || '(No Subject)'}</p>
        <span className="pill shrink-0" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
          {new Date(email.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-2">{email.from}</p>
      <p className="text-sm text-zinc-400 leading-relaxed">{email.snippet}</p>
    </motion.div>
  );
}

export default function GmailView() {
  const [emails, setEmails] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/gmail?limit=15');
      setEmails(data.emails || []);
    } finally {
      setLoading(false);
    }
  };

  const summarize = async () => {
    setSummarizing(true);
    try {
      const data = await api.post('/api/gmail/summarize');
      setSummary(data.summary || '');
    } finally {
      setSummarizing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="section-header flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4285f4,#34a853)' }}>
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="section-title">Gmail</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emails.length} recent emails</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="btn btn-primary" onClick={summarize} disabled={summarizing}>
            {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Summary
          </button>
        </div>
      </div>

      {summary && (
        <div className="glass p-5 mb-5" style={{ borderColor: 'rgba(99,102,241,0.25)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#818cf8' }}>AI Email Summary</p>
          <div className="md text-sm text-zinc-300"><ReactMarkdown>{summary}</ReactMarkdown></div>
        </div>
      )}

      <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
        {loading ? Array(5).fill(0).map((_, i) => (
          <div key={i} className="glass p-4">
            <div className="skeleton h-4 w-3/4 mb-2" /><div className="skeleton h-3 w-1/3 mb-3" /><div className="skeleton h-3 w-full" />
          </div>
        )) : emails.map((e, i) => <EmailCard key={e.id} email={e} idx={i} />)}
      </div>
    </div>
  );
}
