import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../api';

/**
 * Template for creating a new IM-Nexus module view.
 * 
 * To use this template:
 * 1. Copy this file to client/src/views/YourModuleView.jsx
 * 2. Rename the component and update the icon/title
 * 3. Update the API endpoint in the fetch call
 * 4. Customize the card rendering in the list section
 * 5. Add the view to App.jsx NAV array and renderView() switch
 */

export default function TemplateView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Replace '/api/your-endpoint' with your actual endpoint
        const res = await api.get('/api/your-endpoint');
        setData(res.data.items || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-6 text-center" style={{ color: 'var(--text-muted)' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="section-header mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-cyan))' }}>
          {/* Replace with your icon */}
          <span className="text-white text-lg">📦</span>
        </div>
        <div>
          <h2 className="section-title">Module Title</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.length} items</p>
        </div>
      </div>

      {/* Data List */}
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No items found.
          </div>
        ) : (
          data.map((item, i) => (
            <div key={i} className="glass glass-hover p-4">
              <p className="font-semibold" style={{ color: 'var(--text-main)' }}>
                {item.title || item.name}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {item.description || item.snippet || ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
