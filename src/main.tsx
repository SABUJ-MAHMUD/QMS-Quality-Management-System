import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __QMS_APP_MOUNTED__?: boolean;
    __QMS_CLEAR_CACHE_AND_RELOAD__?: () => void;
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected workspace rendering error.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('QMS AppErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#07182e] p-6 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-2xl p-7 shadow-2xl text-center space-y-4">
            <div className="text-xs font-extrabold tracking-widest uppercase text-sky-700">
              Northern Fashions Ltd. &bull; OQL
            </div>
            <h1 className="text-lg font-black text-slate-900">Workspace Recovery</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              The application encountered an unexpected error on this browser or cached session.
              Click below to clear cached data and reload the latest version.
            </p>
            <div className="text-[11px] font-mono text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 break-words">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window.__QMS_CLEAR_CACHE_AND_RELOAD__ === 'function') {
                  window.__QMS_CLEAR_CACHE_AND_RELOAD__();
                } else {
                  window.location.reload();
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
            >
              Clear Cache &amp; Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

if (typeof window !== 'undefined') {
  window.__QMS_APP_MOUNTED__ = true;
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
