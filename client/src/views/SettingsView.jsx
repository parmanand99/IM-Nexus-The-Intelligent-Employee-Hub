import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { Save, Sparkles, Loader2, Info } from 'lucide-react';

export default function SettingsView() {
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const prefs = await api.get('/api/preferences');
        setInstructions(prefs.instructions || '');
      } catch (err) {
        console.error('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      await api.post('/api/preferences', { instructions });
      setStatus('Instructions saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus('Error saving instructions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="view-container p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">AI Personality</h1>
        </div>
        <p className="text-zinc-400">
          Personalize how IM-Nexus assists you. These instructions will be followed in every chat and briefing.
        </p>
      </header>

      <div className="glass-card p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          Custom System Instructions
          <div className="group relative">
            <Info className="w-4 h-4 text-zinc-500 cursor-help" />
            <div className="absolute left-full ml-2 top-0 w-64 p-2 bg-zinc-800 rounded-lg text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-zinc-700 shadow-xl">
              Tell the AI how to behave. Example: "Be extremely concise," "Always use bullet points," or "Call me Captain."
            </div>
          </div>
        </label>
        
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Always summarize emails concisely. If I have a meeting, remind me to prepare notes. Be friendly but professional."
          className="w-full h-64 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none mb-6"
        />

        <div className="flex items-center justify-between">
          <p className={`text-sm ${status.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {status}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Personality
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-white/5">
          <h3 className="text-white font-medium mb-2">Example: Conciseness</h3>
          <p className="text-xs text-zinc-500 italic">"Use absolute minimum words. No small talk. Just facts and direct links."</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-white/5">
          <h3 className="text-white font-medium mb-2">Example: Proactive Assistant</h3>
          <p className="text-xs text-zinc-500 italic">"When I have a meeting, check for related documents and suggest them. Always check for overdue tasks."</p>
        </div>
      </div>
    </div>
  );
}
