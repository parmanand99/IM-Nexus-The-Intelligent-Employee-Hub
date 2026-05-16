import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { api } from './api';
import {
  LayoutDashboard, Mail, Calendar, HardDrive, CheckSquare,
  Users, MessageSquare, Zap, Bell, Settings, LogOut,
  ChevronRight, Sparkles, Loader2, TrendingUp, Clock
} from 'lucide-react';

// Views
import GmailView from './views/GmailView';
import CalendarView from './views/CalendarView';
import DriveView from './views/DriveView';
import TasksView from './views/TasksView';
import ContactsView from './views/ContactsView';
import ChatSpacesView from './views/ChatSpacesView';
import ChatView from './views/ChatView';
import SettingsView from './views/SettingsView';

// ── Sidebar Config ────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gmail', label: 'Gmail', icon: Mail },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'drive', label: 'Drive', icon: HardDrive },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'chat', label: 'Chat Spaces', icon: MessageSquare },
  { id: 'ask', label: 'Ask AI', icon: Zap },
  { id: 'settings', label: 'AI Personality', icon: Settings },
];

// ── Dashboard View ─────────────────────────────────────────────────────────────
function DashboardView({ user, onNavigate }) {
  const [summary, setSummary] = useState('');
  const [stats, setStats] = useState({ events: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get('/api/overview');
        setSummary(d.summary || '');
        setStats({ events: d.eventCount, tasks: d.taskCount });
      }
      finally { setLoading(false); }
    })();
  }, []);

  const cards = [
    { id: 'gmail', label: 'Gmail', icon: Mail, color: '#4285f4', bg: 'rgba(66,133,244,0.1)' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, color: '#673ab7', bg: 'rgba(103,58,183,0.1)' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { id: 'drive', label: 'Drive', icon: HardDrive, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { id: 'contacts', label: 'Contacts', icon: Users, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card glass p-4 flex flex-col justify-center items-center">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Meetings</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{stats.events}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>next 48h</span>
        </div>
        <div className="stat-card glass p-4 flex flex-col justify-center items-center">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Tasks</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{stats.tasks}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>pending</span>
        </div>
        <div className="stat-card glass p-4 flex flex-col justify-center items-center">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Status</span>
          <span className="text-2xl" style={{ color: 'var(--color-accent-green)' }}>●</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Connected</span>
        </div>
      </div>

      {/* AI Briefing */}
      <div className="glass p-6 mb-8" style={{ borderColor: 'var(--color-accent)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>AI Daily Briefing</span>
        </div>
        {loading ? (
          <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-4" style={{ width: `${70 + i * 7}%`, background: 'var(--glass-border)' }} />)}</div>
        ) : (
          <div className="md leading-relaxed" style={{ color: 'var(--text-main)' }}>
            <ReactMarkdown>{summary || 'No data available for today.'}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.button key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => onNavigate(c.id)}
            className="glass glass-hover p-5 text-left flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
              <c.icon className="w-5 h-5" style={{ color: c.color }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{c.label}</p>
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-sub)' }}>Open <ChevronRight className="w-3 h-3" /></p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState(null);
  const [isLightMode, setIsLightMode] = useState(false);

  // Toggle theme class on body
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLightMode]);

  const checkAuth = async () => {
    try {
      const d = await api.get('/api/auth/status');
      setIsConnected(d.authenticated);
      setUser(d.user || null);
    } catch { }
  };

  useEffect(() => {
    checkAuth();
    // Handle OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      api.post('/api/auth/callback', { code, redirectUri: window.location.origin })
        .then(d => { if (d.status === 'success') { checkAuth(); window.history.replaceState({}, '', '/'); } })
        .catch(() => { });
    }
  }, []);

  const connectGoogle = async () => {
    setIsConnecting(true);
    try {
      const d = await api.get(`/api/auth/url?origin=${encodeURIComponent(window.location.origin)}`);
      if (d.url) {
        window.location.href = d.url;
      } else {
        alert('Failed to get auth URL');
      }
    } catch (err) {
      alert(`Connection failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;
    try {
      await api.post('/api/auth/logout');
      setIsConnected(false);
      setUser(null);
      setActive('dashboard');
    } catch (err) {
      alert('Logout failed');
    }
  };

  const renderView = () => {
    if (!isConnected) return null;
    const views = {
      dashboard: <DashboardView user={user} onNavigate={setActive} />,
      gmail: <GmailView />,
      calendar: <CalendarView />,
      drive: <DriveView />,
      tasks: <TasksView />,
      contacts: <ContactsView />,
      chat: <ChatSpacesView />,
      ask: <ChatView />,
      settings: <SettingsView />,
    };
    return views[active] || <DashboardView user={user} onNavigate={setActive} />;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-main)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--glass-border)', padding: '20px 12px', background: 'var(--bg-sidebar)', flexShrink: 0, zIndex: 10 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 24 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap style={{ width: 18, height: 18, color: '#fff', fill: '#fff' }} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-main)' }}>IM-Nexus</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1.2, padding: '0 8px', marginBottom: 6 }}>Workspace</p>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)}
              className={`sidebar-item${active === item.id ? ' active' : ''}`}>
              <item.icon style={{ width: 16, height: 16 }} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            {user.picture
              ? <img src={user.picture} alt={user.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{user.name?.[0]}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
              <p style={{ fontSize: 10, color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
          </div>
        )}
        {/* Theme Toggle & Logout Footer */}
        <div className="mt-auto pt-6 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors mb-2"
            style={{ color: 'var(--text-main)' }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4" />
              {isLightMode ? 'Dark Mode' : 'Light Mode'}
            </div>
            <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${isLightMode ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isLightMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 32, position: 'relative' }}>
        {/* Ambient bg */}
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
        <div className="ambient-blob-3" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
          {!isConnected ? (
            /* Connect screen */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 20px 60px var(--glass-shadow)' }}>
                <Zap style={{ width: 40, height: 40, color: '#fff', fill: '#fff' }} />
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>IM-Nexus: The Intelligent Employee <span style={{ color: 'var(--color-accent)' }}>Hub</span></h1>
              <p style={{ color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.7, marginBottom: 32, fontSize: 15 }}>
                Your all-in-one Google Workspace intelligence hub. Connect your account to access Gmail, Calendar, Drive, Tasks, Contacts, Chat, and AI-powered insights.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 36 }}>
                {['Gmail', 'Calendar', 'Drive', 'Docs', 'Sheets', 'Tasks', 'Contacts', 'Chat', 'Forms', 'Analytics'].map(f => (
                  <span key={f} className="pill" style={{ background: 'var(--glass-bg)', color: 'var(--text-sub)', border: '1px solid var(--glass-border)' }}>{f}</span>
                ))}
              </div>
              <button className="btn btn-primary" style={{ fontSize: 15, padding: '13px 32px' }} onClick={connectGoogle} disabled={isConnecting}>
                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {isConnecting ? 'Connecting...' : 'Sign in with Google'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 20 }}>Your data is only read. Nothing is modified without your action.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                {renderView()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
