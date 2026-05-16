import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global error logger for debugging the white screen
window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = `<div style="padding: 20px; color: #ff4444; background: #1a1a1a; font-family: monospace;">
    <h1 style="color: #ff4444;">🚨 Runtime Error Detected</h1>
    <p><b>Message:</b> ${message}</p>
    <p><b>Source:</b> ${source}:${lineno}</p>
    <pre style="background: #000; padding: 10px; border-radius: 5px;">${error?.stack || 'No stack trace'}</pre>
  </div>`;
  return false;
};

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (e) {
  console.error("Rendering failed:", e);
  document.body.innerHTML = `<div style="padding: 20px; color: red;"><h1>Rendering Failed</h1><pre>${e.stack}</pre></div>`;
}
