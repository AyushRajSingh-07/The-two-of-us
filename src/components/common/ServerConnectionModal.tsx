import React, { useState, useEffect } from 'react';
import { X, Server, Wifi, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, HelpCircle } from 'lucide-react';
import { Api, getBackendUrl, setBackendUrl, reconnectWebSocket } from '../../lib/api';

interface ServerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerConnectionModal: React.FC<ServerConnectionModalProps> = ({ isOpen, onClose }) => {
  const [urlInput, setUrlInput] = useState(getBackendUrl());
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successSaved, setSuccessSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getBackendUrl());
      testUrl(getBackendUrl());
    }
  }, [isOpen]);

  const testUrl = async (testUrlStr: string) => {
    setStatus('checking');
    setErrorMsg('');
    setServerInfo(null);
    try {
      const clean = testUrlStr.trim().replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/health`, {
        headers: {
          'ngrok-skip-browser-warning': '1',
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus('online');
        setServerInfo(data);
      } else {
        setStatus('offline');
        setErrorMsg(`Server responded with HTTP ${res.status}`);
      }
    } catch (err: any) {
      setStatus('offline');
      setErrorMsg('Cannot reach backend. Make sure the laptop server and ngrok tunnel are running.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setBackendUrl(urlInput.trim());
    reconnectWebSocket();
    setSuccessSaved(true);
    testUrl(urlInput.trim());
    setTimeout(() => setSuccessSaved(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#191422] rounded-3xl max-w-lg w-full p-6 border border-rose-100 dark:border-rose-900/50 shadow-2xl relative space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-500 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-warmgray-900 dark:text-warmgray-100">
                Sanctuary Server & ngrok Connection
              </h2>
              <p className="text-xs text-warmgray-500 dark:text-warmgray-400">
                Configure your private backend host for live cross-device play
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-warmgray-400 hover:text-warmgray-600 dark:hover:text-warmgray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className={`p-3.5 rounded-2xl flex items-center justify-between border ${
          status === 'online'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : status === 'checking'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {status === 'online' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : status === 'checking' ? (
              <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500" />
            )}
            <div>
              <div className="font-bold text-xs sm:text-sm">
                {status === 'online'
                  ? 'Connected to Private Sanctuary Backend'
                  : status === 'checking'
                  ? 'Testing connection...'
                  : 'Backend Disconnected / Offline'}
              </div>
              <div className="text-[11px] opacity-80">
                {status === 'online' && serverInfo
                  ? `Timezone: ${serverInfo.timezone || 'Asia/Kolkata'} • Real-Time Sync Active`
                  : errorMsg || 'Please verify that your laptop server and ngrok are running.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => testUrl(urlInput)}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            title="Refresh connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-warmgray-700 dark:text-warmgray-300 mb-1">
              Backend API & WebSocket URL
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. https://xxxx.ngrok-free.app or http://localhost:3001"
              required
              className="w-full px-3.5 py-2.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/40 bg-warmgray-50/50 dark:bg-[#20182a] text-xs font-mono text-warmgray-900 dark:text-warmgray-100 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-warmgray-500 dark:text-warmgray-400">
              {successSaved && <span className="text-emerald-600 font-semibold">Saved & reconnecting...</span>}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => testUrl(urlInput)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-warmgray-200 dark:border-rose-900/40 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
              >
                Test URL
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>

        {/* Instructions Guide */}
        <div className="p-3.5 rounded-2xl bg-warmgray-50 dark:bg-[#20182a] border border-warmgray-200 dark:border-rose-900/30 text-xs space-y-2 text-warmgray-600 dark:text-warmgray-300">
          <div className="flex items-center gap-1.5 font-semibold text-warmgray-800 dark:text-warmgray-200 text-xs">
            <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>How to run the backend on your laptop with ngrok:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-warmgray-600 dark:text-warmgray-400">
            <li>Open a terminal on your laptop and start the server: <code className="font-mono bg-white dark:bg-black/40 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400">npm run server</code></li>
            <li>In another terminal, start ngrok: <code className="font-mono bg-white dark:bg-black/40 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400">ngrok http 3001</code></li>
            <li>Copy the forwarding URL (e.g. <code className="font-mono bg-white dark:bg-black/40 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400">https://xyz.ngrok-free.app</code>) and paste it into the field above.</li>
            <li>Whenever ngrok restarts with a new URL, simply paste the new URL here on your phone or PC without needing to redeploy!</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
