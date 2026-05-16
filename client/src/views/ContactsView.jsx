import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { Users, Search, Mail, Phone, Building2, RefreshCw } from 'lucide-react';

function ContactCard({ contact, idx }) {
  const initials = (contact.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#6366f1','#10b981','#f59e0b','#a855f7','#22d3ee','#f43f5e'];
  const bg = colors[contact.name?.charCodeAt(0) % colors.length] || '#6366f1';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.04 }}
      className="glass glass-hover p-4 flex items-center gap-4">
      {contact.photo ? (
        <img src={contact.photo} alt={contact.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
          style={{ background: bg }}>{initials}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 truncate">{contact.name}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
          {contact.email && <span className="flex items-center gap-1 text-xs text-zinc-500"><Mail className="w-3 h-3" />{contact.email}</span>}
          {contact.phone && <span className="flex items-center gap-1 text-xs text-zinc-500"><Phone className="w-3 h-3" />{contact.phone}</span>}
          {contact.org && <span className="flex items-center gap-1 text-xs text-zinc-500"><Building2 className="w-3 h-3" />{contact.org}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default function ContactsView() {
  const [contacts, setContacts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (q = '') => {
    setLoading(true);
    try { const d = await api.get(`/api/contacts?q=${encodeURIComponent(q)}`); setContacts(d.contacts || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="section-header flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}>
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="section-title">Contacts</h2>
            <p style={{ fontSize: 12, color: '#71717a' }}>{contacts.length} contacts</p>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => load(query)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form onSubmit={e => { e.preventDefault(); load(query); }} className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input className="field" style={{ paddingLeft: 36 }} placeholder="Search contacts..." value={query}
            onChange={e => setQuery(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary"><Search className="w-4 h-4" /> Search</button>
      </form>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="glass p-4 flex gap-4"><div className="skeleton w-10 h-10 rounded-full" /><div className="flex-1"><div className="skeleton h-4 w-1/2 mb-2" /><div className="skeleton h-3 w-2/3" /></div></div>
        )) : contacts.length === 0 ? (
          <div className="glass p-8 text-center text-zinc-500 col-span-full">No contacts found.</div>
        ) : contacts.map((c, i) => <ContactCard key={i} contact={c} idx={i} />)}
      </div>
    </div>
  );
}
