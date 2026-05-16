import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { HardDrive, Search, ExternalLink, FileText, Sheet, Loader2, RefreshCw, Plus, X } from 'lucide-react';

function CreateDocModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title) return;
    setLoading(true);
    try {
      await api.post('/api/docs/create', form);
      onCreated();
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="glass w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">New Google Doc</h3>
          <button onClick={onClose} className="btn btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <input className="field" placeholder="Document title *" value={form.title} onChange={e => set('title', e.target.value)} />
          <textarea className="field" style={{ resize: 'none', height: 120 }} placeholder="Start typing your note here..." value={form.content} onChange={e => set('content', e.target.value)} />
          <button className="btn btn-primary w-full mt-1" onClick={submit} disabled={loading || !form.title}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Doc
          </button>
        </div>
      </div>
    </div>
  );
}

const MIME_LABELS = {
  'application/vnd.google-apps.document': { label: 'Doc', cls: 'type-doc' },
  'application/vnd.google-apps.spreadsheet': { label: 'Sheet', cls: 'type-sheet' },
  'application/vnd.google-apps.presentation': { label: 'Slide', cls: 'type-slide' },
  'application/pdf': { label: 'PDF', cls: 'type-pdf' },
};

function FileCard({ file, idx }) {
  const type = MIME_LABELS[file.type] || { label: 'File', cls: 'type-other' };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      className="glass glass-hover p-4 flex items-center gap-4">
      <div className={`text-2xl font-black w-10 text-center shrink-0 ${type.cls}`} style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
        {type.label}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 truncate">{file.name}</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {file.owner} · {new Date(file.modified).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      {file.link && (
        <a href={file.link} target="_blank" rel="noreferrer" className="btn btn-ghost p-2 shrink-0">
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </motion.div>
  );
}

export default function DriveView() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = async (q = '') => {
    q ? setSearching(true) : setLoading(true);
    try {
      const data = await api.get(`/api/drive?q=${encodeURIComponent(q)}&limit=25`);
      setFiles(data.files || []);
    } finally { setLoading(false); setSearching(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(query);
  };

  return (
    <div>
      <div className="section-header flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#fbbc05,#ea4335)' }}>
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="section-title">Drive</h2>
            <p style={{ fontSize: 12, color: '#71717a' }}>Docs, Sheets, Slides & more</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => load(query)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Doc
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input className="field" style={{ paddingLeft: 36 }} placeholder="Search files by name..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={searching}>
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="glass p-4 flex gap-4"><div className="skeleton w-10 h-10 rounded" /><div className="flex-1"><div className="skeleton h-4 w-2/3 mb-2" /><div className="skeleton h-3 w-1/3" /></div></div>
        )) : files.length === 0 ? (
          <div className="glass p-8 text-center text-zinc-500">No files found{query ? ` for "${query}"` : ''}.</div>
        ) : files.map((f, i) => <FileCard key={f.id} file={f} idx={i} />)}
      </div>

      <AnimatePresence>
        {showCreate && <CreateDocModal onClose={() => setShowCreate(false)} onCreated={() => load()} />}
      </AnimatePresence>
    </div>
  );
}
