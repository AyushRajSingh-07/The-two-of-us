import React, { createContext, useContext, useState, useEffect } from 'react';
import { CoupleSpace, UserProfile } from '../types';
import { DataStore } from '../lib/store';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  couple: CoupleSpace | null;
  currentUser: UserProfile;
  partner: UserProfile;
  activeUserId: string;
  isPartner1Active: boolean;
  isPaired: boolean;
  isSupabase: boolean;
  switchActiveUser: () => void;
  updateCoupleSettings: (updates: Partial<CoupleSpace>) => Promise<void>;
  pairWithInviteCode: (code: string, name: string) => Promise<boolean>;
  refreshCouple: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [couple, setCouple] = useState<CoupleSpace | null>(null);
  const [activePartnerIndex, setActivePartnerIndex] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);

  // Load active partner preference from session/localStorage
  useEffect(() => {
    const saved = localStorage.getItem('two_of_us_active_partner');
    if (saved === '2') setActivePartnerIndex(2);
  }, []);

  const loadData = async () => {
    const c = await DataStore.getCoupleSpace();
    setCouple(c);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = DataStore.onSync((e) => {
      if (e.type === 'COUPLE_UPDATED') {
        setCouple(e.payload);
      }
    });
    return unsub;
  }, []);

  const switchActiveUser = () => {
    const next = activePartnerIndex === 1 ? 2 : 1;
    setActivePartnerIndex(next);
    localStorage.setItem('two_of_us_active_partner', String(next));
  };

  const updateCoupleSettings = async (updates: Partial<CoupleSpace>) => {
    if (!couple) return;
    const updated = { ...couple, ...updates };
    setCouple(updated);
    await DataStore.saveCoupleSpace(updated);
  };

  const pairWithInviteCode = async (code: string, name: string): Promise<boolean> => {
    if (!couple) return false;
    if (couple.inviteCode.trim().toUpperCase() === code.trim().toUpperCase()) {
      const updated: CoupleSpace = {
        ...couple,
        partner2Name: name || couple.partner2Name,
        isPaired: true,
      };
      setCouple(updated);
      await DataStore.saveCoupleSpace(updated);
      return true;
    }
    return false;
  };

  const refreshCouple = async () => {
    await loadData();
  };

  const p1: UserProfile = {
    id: 'partner-1',
    name: couple?.partner1Name || 'Partner 1',
    avatar: couple?.partner1Avatar || '',
    isPartner1: true,
  };

  const p2: UserProfile = {
    id: 'partner-2',
    name: couple?.partner2Name || 'Partner 2',
    avatar: couple?.partner2Avatar || '',
    isPartner1: false,
  };

  const currentUser = activePartnerIndex === 1 ? p1 : p2;
  const partner = activePartnerIndex === 1 ? p2 : p1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-champagne-50">
        <div className="text-center p-8">
          <div className="w-12 h-12 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-warmgray-600 font-medium">Entering your private sanctuary...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        couple,
        currentUser,
        partner,
        activeUserId: currentUser.id,
        isPartner1Active: activePartnerIndex === 1,
        isPaired: couple?.isPaired ?? true,
        isSupabase: isSupabaseConfigured,
        switchActiveUser,
        updateCoupleSettings,
        pairWithInviteCode,
        refreshCouple,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
