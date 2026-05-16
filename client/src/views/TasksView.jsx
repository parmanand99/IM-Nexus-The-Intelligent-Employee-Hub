import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { CheckSquare, Clock, RefreshCw, AlertCircle, Plus, X, Loader2 } from 'lucide-react';

function CreateTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', notes: '', due: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title) return;
    setLoading(true);
    try {
      await api.post('/api/tasks/create', form);
      onCreated();
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="glass w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">Add New Task</h3>
          <button onClick={onClose} className="btn btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <input className="field" placeholder="Task title *" value={form.title} onChange={e => set('title', e.target.value)} />
          <textarea className="field" style={{ resize: 'none', height: 72 }} placeholder="Notes (optional)" value={form.notes} onChange={e => set('notes', e.target.value)} />
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Due Date (optional)</label>
            <input className="field" type="date" value={form.due} onChange={e => set('due', e.target.value)} />
          </div>
          <button className="btn btn-primary w-full mt-1" onClick={submit} disabled={loading || !form.title}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, idx }) {
  const isOverdue = task.due && new Date(task.due) < new Date();
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
      className="glass glass-hover p-4 flex gap-4 items-start">
      <div className="mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center"
        style={{ borderColor: isOverdue ? '#f43f5e' : '#6366f1' }}>
        {isOverdue && <AlertCircle className="w-3 h-3" style={{ color: '#f43f5e' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100">{task.title}</p>
        {task.notes && <p className="text-xs text-zinc-500 mt-1">{task.notes}</p>}
        <div className="flex items-center gap-3 mt-2">
          <span className="pill" style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a' }}>{task.listName}</span>
          {task.due && (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-400' : 'text-zinc-500'}`}>
              <Clock className="w-3 h-3" />
              {isOverdue ? 'Overdue · ' : ''}
              {new Date(task.due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const d = await api.get('/api/tasks'); setTasks(d.tasks || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const overdue = tasks.filter(t => t.due && new Date(t.due) < new Date());
  const upcoming = tasks.filter(t => !t.due || new Date(t.due) >= new Date());

  return (
    <div>
      <div className="section-header flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#0891b2)' }}>
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="section-title">Tasks</h2>
            <p style={{ fontSize: 12, color: '#71717a' }}>{tasks.length} pending · {overdue.length} overdue</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#f43f5e' }}>⚠ Overdue</p>
          <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
            {overdue.map((t, i) => <TaskCard key={t.id} task={t} idx={i} />)}
          </div>
        </div>
      )}

      <div>
        {overdue.length > 0 && upcoming.length > 0 && (
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#71717a' }}>Upcoming</p>
        )}
        <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
          {loading ? Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass p-4 flex gap-4"><div className="skeleton w-5 h-5 rounded" /><div className="flex-1"><div className="skeleton h-4 w-2/3 mb-2" /><div className="skeleton h-3 w-1/3" /></div></div>
          )) : upcoming.length === 0 && overdue.length === 0 ? (
            <div className="glass p-8 text-center text-zinc-500">No pending tasks. Great job! 🎉</div>
          ) : upcoming.map((t, i) => <TaskCard key={t.id} task={t} idx={i} />)}
        </div>
      </div>

      <AnimatePresence>
        {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onCreated={() => load()} />}
      </AnimatePresence>
    </div>
  );
}
