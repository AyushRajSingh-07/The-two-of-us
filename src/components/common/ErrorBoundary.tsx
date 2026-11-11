import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Heart, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('two_of_us_active_partner');
      // Keep essential data safe but clear any transient state
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8f6] text-warmgray-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Heart className="w-8 h-8 fill-rose-500 animate-pulse" />
            </div>
            
            <h1 className="font-serif font-bold text-2xl text-warmgray-900">
              Two of Us • Sanctuary
            </h1>
            
            <p className="text-sm text-warmgray-600">
              A temporary ripple occurred while loading your sanctuary. Your messages, photos, and game milestones remain completely safe.
            </p>

            {this.state.error?.message && (
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl text-left text-xs font-mono text-rose-800 break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl text-xs font-semibold hover:from-rose-700 hover:to-rose-800 transition shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Sanctuary</span>
              </button>
              
              <button
                onClick={this.handleResetCache}
                className="w-full sm:w-auto px-4 py-2.5 bg-warmgray-100 text-warmgray-700 hover:bg-warmgray-200 rounded-2xl text-xs font-semibold transition"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
