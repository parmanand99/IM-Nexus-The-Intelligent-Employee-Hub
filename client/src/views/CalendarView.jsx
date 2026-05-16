import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { Calendar, Plus, X, Video, MapPin, Users, Loader2, Clock } from 'lucide-react';

function EventCard({ event, idx }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const isAllDay = event.start && !event.start.includes('T');
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
      className="glass glass-hover p-4">
      <div className="flex gap-4">
        <div className="shrink-0 text-center w-12">
          <p className="text-xs text-zinc-500">{start.toLocaleDateString('en-IN', { month: 'short' })}</p>
          <p className="text-2xl font-bold text-white leading-tight">{start.getDate()}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-100 mb-1 truncate">{event.summary}</p>
          <div className="flex flex-wrap gap-3">
            {!isAllDay && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {event.location && <span className="flex items-center gap-1 text-xs text-zinc-500"><MapPin className="w-3 h-3" />{event.location}</span>}
            {event.attendees?.length > 0 && <span className="flex items-center gap-1 text-xs text-zinc-500"><Users className="w-3 h-3" />{event.attendees.length} attendees</span>}
            {event.meetLink && <a href={event.meetLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs" style={{ color: '#22d3ee' }}><Video className="w-3 h-3" />Join Meet</a>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreateEventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', start: '', end: '', attendees: '', addMeet: true, description: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.start || !form.end) return;
    setLoading(true);
    try {
      const data = await api.post('/api/calendar/create', {
        title: form.title, start: form.start, end: form.end, description: form.description,
        attendees: form.attendees.split(',').map(s => s.trim()).filter(Boolean),
        addMeet: form.addMeet,
      });
      onCreated(data.event);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">Create Meeting</h3>
          <button onClick={onClose} className="btn btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <input className="field" placeholder="Meeting title *" value={form.title} onChange={e => set('title', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-zinc-500 mb-1 block">Start *</label>
              <input className="field" type="datetime-local" value={form.start} onChange={e => set('start', e.target.value)} /></div>
            <div><label className="text-xs text-zinc-500 mb-1 block">End *</label>
              <input className="field" type="datetime-local" value={form.end} onChange={e => set('end', e.target.value)} /></div>
          </div>
          <input className="field" placeholder="Attendees (comma-separated emails)" value={form.attendees} onChange={e => set('attendees', e.target.value)} />
          <textarea className="field" style={{ resize: 'none', height: 72 }} placeholder="Description (optional)" value={form.description} onChange={e => set('description', e.target.value)} />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
            <input type="checkbox" checked={form.addMeet} onChange={e => set('addMeet', e.target.checked)} className="accent-indigo-500" />
            Add Google Meet link
          </label>
          <button className="btn btn-primary w-full mt-1" onClick={submit} disabled={loading || !form.title || !form.start || !form.end}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Event
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const d = await api.get('/api/calendar?days=14'); setEvents(d.events || []); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="section-header flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4285f4,#673ab7)' }}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="section-title">Calendar</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Next 14 days</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Meeting
        </button>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
        {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="glass p-4"><div className="skeleton h-4 w-1/2 mb-2" /><div className="skeleton h-3 w-1/3" /></div>)
          : events.length === 0 ? <div className="glass p-8 text-center text-zinc-500">No upcoming events in the next 14 days.</div>
          : events.map((e, i) => <EventCard key={e.id} event={e} idx={i} />)}
      </div>

      <AnimatePresence>
        {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreated={() => load()} />}
      </AnimatePresence>
    </div>
  );
}
