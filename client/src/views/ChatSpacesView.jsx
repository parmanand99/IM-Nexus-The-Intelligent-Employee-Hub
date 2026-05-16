import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import { MessageSquare, ChevronRight, Loader2, ArrowLeft, Users } from 'lucide-react';

function SpaceCard({ space, onClick, idx }) {
  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
      onClick={onClick} className="glass glass-hover p-4 text-left w-full flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: space.type === 'DIRECT_MESSAGE' ? 'rgba(34,211,238,0.15)' : 'rgba(168,85,247,0.15)' }}>
        {space.type === 'DIRECT_MESSAGE'
          ? <MessageSquare className="w-5 h-5" style={{ color: '#22d3ee' }} />
          : <Users className="w-5 h-5" style={{ color: '#a855f7' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 truncate">{space.displayName || '(Direct Message)'}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{space.spaceType || space.type}</p>
      </div>
      <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
    </motion.button>
  );
}

function MessagesPanel({ space, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get(`/api/chat/spaces/${encodeURIComponent(space.name)}/messages`);
        setData(d);
      } finally { setLoading(false); }
    })();
  }, [space.name]);

  return (
    <div>
      <button onClick={onBack} className="btn btn-ghost mb-5" style={{ fontSize: 13 }}>
        <ArrowLeft className="w-4 h-4" /> Back to Spaces
      </button>
      <h3 className="text-lg font-bold text-zinc-100 mb-4">{space.displayName || 'Direct Message'}</h3>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
      ) : (
        <>
          {data?.summary && (
            <div className="glass p-5 mb-5" style={{ borderColor: 'rgba(168,85,247,0.25)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a855f7' }}>AI Summary</p>
              <div className="md text-sm text-zinc-300"><ReactMarkdown>{data.summary}</ReactMarkdown></div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {(data?.messages || []).map((m, i) => (
              <div key={i} className="glass p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>{m.sender}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(m.createTime).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-sm text-zinc-300">{m.text}</p>
              </div>
            ))}
            {(!data?.messages || data.messages.length === 0) && (
              <div className="glass p-8 text-center" style={{ color: 'var(--text-muted)' }}>No messages found in this space.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ChatSpacesView() {
  const [spaces, setSpaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const d = await api.get('/api/chat/spaces'); setSpaces(d.spaces || []); }
      finally { setLoading(false); }
    })();
  }, []);

  if (selected) return <MessagesPanel space={selected} onBack={() => setSelected(null)} />;

  return (
    <div>
      <div className="section-header">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#a855f7,#22d3ee)' }}>
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="section-title">Google Chat</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{spaces.length} spaces & DMs</p>
        </div>
      </div>
      <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="glass p-4 flex gap-4"><div className="skeleton w-10 h-10 rounded-xl" /><div className="flex-1"><div className="skeleton h-4 w-1/2 mb-2" /><div className="skeleton h-3 w-1/3" /></div></div>
        )) : spaces.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            <p className="font-semibold mb-2">No Chat spaces found.</p>
            <p className="text-xs">Note: Google Chat API requires a Workspace account and is not supported on personal Gmail accounts.</p>
          </div>
        ) : spaces.map((s, i) => <SpaceCard key={s.name} space={s} idx={i} onClick={() => setSelected(s)} />)}
      </div>
    </div>
  );
}
