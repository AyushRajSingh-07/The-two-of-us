import React, { useState, useEffect } from 'react';
import { Heart, Lock, Key, Server, Wifi, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Eye, EyeOff, Globe } from 'lucide-react';
import { Api, getBackendUrl, setBackendUrl } from '../../lib/api';
import { fireHeartConfetti } from './Confetti';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onContinueOffline: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onContinueOffline }) => {
  const [selectedUser, setSelectedUser] = useState<'ayush' | 'vrishti'>('ayush');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Server & ngrok configuration state
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [backendUrlInput, setBackendUrlInput] = useState(getBackendUrl());
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [testResultMsg, setTestResultMsg] = useState('');

  // Check server health on mount
  useEffect(() => {
    checkServer(getBackendUrl());
  }, []);

  const checkServer = async (url: string) => {
    setServerStatus('checking');
    setTestResultMsg('');
    try {
      // Temporarily test the URL
      const clean = url.trim().replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/health`, {
        headers: { 'ngrok-skip-browser-warning': '1', 'Accept': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setServerStatus('online');
        setTestResultMsg(`Connected! (${json.sanctuary || 'Sanctuary Backend'})`);
      } else {
        setServerStatus('offline');
        setTestResultMsg(`Server returned HTTP ${res.status}`);
      }
    } catch (e: any) {
      setServerStatus('offline');
      setTestResultMsg('Cannot reach backend. Is server & ngrok running?');
    }
  };

  const handleSaveBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backendUrlInput.trim()) return;
    setBackendUrl(backendUrlInput.trim());
    checkServer(backendUrlInput.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await Api.login(selectedUser, password);
      if (res && res.token) {
        fireHeartConfetti();
        onLoginSuccess(res.user);
      } else {
        setErrorMessage('Authentication failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials or server URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-[#faf7f5] to-champagne-100/70 dark:from-[#0f0d14] dark:via-[#15101d] dark:to-[#1a1222] flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#191422] rounded-3xl p-6 sm:p-8 border border-rose-100 dark:border-rose-900/50 shadow-2xl relative overflow-hidden animate-fade-in transition-colors">
        
        {/* Decorative soft glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-200/40 dark:bg-rose-900/30 rounded-full blur-2xl -z-0 pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/60 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-rose-50/50 dark:ring-rose-950/30">
            <Heart className="w-8 h-8 fill-rose-500 animate-pulse" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-warmgray-900 dark:text-warmgray-100">
            The Two of Us
          </h1>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider mt-0.5">
            Private Sanctuary
          </p>
          <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mt-2 max-w-xs mx-auto">
            A private romantic world created for Ayush & Vrishti.
          </p>
        </div>

        {/* Account Selector Pill */}
        <div className="relative z-10 mb-5">
          <label className="block text-xs font-semibold text-warmgray-600 dark:text-warmgray-300 mb-2 text-center">
            Who is entering today?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Ayush Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedUser('ayush');
                setErrorMessage('');
              }}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedUser === 'ayush'
                  ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400/40'
                  : 'border-warmgray-200 dark:border-rose-900/30 hover:bg-warmgray-50 dark:hover:bg-[#20182a] text-warmgray-700 dark:text-warmgray-300'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                alt="Ayush"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-200 dark:ring-rose-800"
              />
              <span className="font-serif font-bold text-sm">Ayush</span>
              <span className="text-[10px] text-warmgray-400">Partner 1</span>
            </button>

            {/* Vrishti Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedUser('vrishti');
                setErrorMessage('');
              }}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedUser === 'vrishti'
                  ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400/40'
                  : 'border-warmgray-200 dark:border-rose-900/30 hover:bg-warmgray-50 dark:hover:bg-[#20182a] text-warmgray-700 dark:text-warmgray-300'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                alt="Vrishti"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-200 dark:ring-rose-800"
              />
              <span className="font-serif font-bold text-sm">Vrishti</span>
              <span className="text-[10px] text-warmgray-400">Partner 2</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-warmgray-700 dark:text-warmgray-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                Password for {selectedUser === 'ayush' ? 'Ayush' : 'Vrishti'}
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-normal">
                (default: {selectedUser}123)
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Enter password for ${selectedUser}`}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-warmgray-200 dark:border-rose-900/40 bg-warmgray-50/50 dark:bg-[#20182a] text-sm text-warmgray-900 dark:text-warmgray-100 placeholder:text-warmgray-400 focus:outline-hidden focus:ring-2 focus:ring-rose-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warmgray-400 hover:text-warmgray-600 dark:hover:text-warmgray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-2xl font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Our Sanctuary</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Server & ngrok Connection Accordion */}
        <div className="mt-6 pt-4 border-t border-rose-100 dark:border-rose-900/40 relative z-10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="flex items-center gap-2 text-xs font-medium text-warmgray-600 dark:text-warmgray-400 hover:text-rose-600 dark:hover:text-rose-300 transition"
            >
              <Server className="w-3.5 h-3.5 text-rose-500" />
              <span>Backend Server & ngrok Setup</span>
            </button>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              serverStatus === 'online'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : serverStatus === 'checking'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                serverStatus === 'online' ? 'bg-emerald-500' : serverStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
              }`} />
              {serverStatus === 'online' ? 'Online' : serverStatus === 'checking' ? 'Checking' : 'Offline'}
            </span>
          </div>

          {showServerConfig && (
            <div className="mt-3 p-3.5 rounded-2xl bg-rose-50/50 dark:bg-[#20182a] border border-rose-100 dark:border-rose-900/30 text-xs space-y-2.5 animate-fade-in">
              <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 leading-relaxed">
                If the backend is running on your laptop with ngrok (<code className="font-mono bg-white dark:bg-black/30 px-1 py-0.5 rounded text-rose-600 dark:text-rose-300">ngrok http 3001</code>), paste the https URL below so both devices connect!
              </p>

              <form onSubmit={handleSaveBackendUrl} className="flex gap-2">
                <input
                  type="url"
                  value={backendUrlInput}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  placeholder="https://xxxx.ngrok-free.app or http://localhost:3001"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-warmgray-200 dark:border-rose-900/40 text-xs bg-white dark:bg-[#15111c] text-warmgray-900 dark:text-warmgray-100"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition"
                >
                  Save & Test
                </button>
              </form>

              {testResultMsg && (
                <p className={`text-[11px] font-medium ${
                  serverStatus === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {testResultMsg}
                </p>
              )}
            </div>
          )}

          {/* Offline fallback button */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onContinueOffline}
              className="text-[11px] text-warmgray-400 hover:text-warmgray-600 dark:hover:text-warmgray-300 underline transition"
            >
              Continue in Offline Preview Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
