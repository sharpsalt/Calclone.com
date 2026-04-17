import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

// Global dev overlay for uncaught errors and promise rejections.
function showDevOverlay(message: string) {
  try {
    let el = document.getElementById('__dev_error_overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = '__dev_error_overlay';
      Object.assign(el.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        right: '0',
        zIndex: '99999',
        padding: '12px',
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        maxHeight: '40vh',
        overflow: 'auto',
      });
      el.addEventListener('click', () => { el!.style.display = 'none'; });
      document.body.appendChild(el);
    }
    el.style.display = 'block';
    el.textContent = message;
  } catch {
    // ignore overlay failures
  }
}

window.addEventListener('error', (ev) => {
  const e = ev as ErrorEvent;
  showDevOverlay(`Error: ${e.message}\n${e.filename}:${e.lineno}:${e.colno}\n${e.error?.stack ?? ''}`);
});

window.addEventListener('unhandledrejection', (ev) => {
  // @ts-ignore
  const r = ev.reason || ev.detail || ev;
  showDevOverlay(`Unhandled Rejection:\n${r && r.stack ? r.stack : String(r)}`);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
