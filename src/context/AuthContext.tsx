import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CoupleSpace, UserProfile, SharedDailyCounterState } from '../types';
import { DataStore } from '../lib/store';
import { isSupabaseConfigured } from '../lib/supabase';
import { getKolkataDateString } from '../lib/utils';

interface AuthContextType {
  couple: CoupleSpace | null;
  currentUser: UserProfile;
  partner: UserProfile;
  activeUserId: string;
  isPartner1Active: boolean;
  isPaired: boolean;
  isSupabase: boolean;
  dailyCounter: SharedDailyCounterState;
  switchActiveUser: () => void;
  updateCoupleSettings: (updates: Partial<CoupleSpace>) => Promise<void>;
  updateMyProfile: (profile: { name?: string; avatar?: string; bio?: string }) => Promise<void>;
  pairWithInviteCode: (code: string, name: string) => Promise<boolean>;
  refreshCouple: () => Promise<void>;
  triggerCheckin: () => Promise<void>;
}

const INITIAL_COUNTER_STATE: SharedDailyCounterState = {
  sharedCount: 0,
  todayDate: getKolkataDateString(),
  todayRecord: {
    date: getKolkataDateString(),
    partner1CheckedIn: false,
    partner2CheckedIn: false,
    bothCompleted: false,
  },
  history: {},
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [couple, setCouple] = useState<CoupleSpace | null>(null);
  const [activePartnerIndex, setActivePartnerIndex] = useState<1 | 2>(1);
  const [dailyCounter, setDailyCounter] = useState<SharedDailyCounterState>(INITIAL_COUNTER_STATE);
  const [loading, setLoading] = useState(true);

  // Load active partner preference from session/localStorage
  useEffect(() => {
    const saved = localStorage.getItem('two_of_us_active_partner');
    if (saved === '2') setActivePartnerIndex(2);
  }, []);

  const loadData = useCallback(async () => {
    const c = await DataStore.getCoupleSpace();
    setCouple(c);
    const counter = await DataStore.getDailyCounterState(c.id);
    setDailyCounter(counter);
    setLoading(false);
  }, []);

  // Record login check-in for current active user
  const handleCheckin = useCallback(async (spaceId: string, isP1: boolean) => {
    const updated = await DataStore.recordDailyLogin(spaceId, isP1);
    setDailyCounter(updated);
  }, []);

  useEffect(() => {
    loadData().then(async () => {
      const c = await DataStore.getCoupleSpace();
      if (c) {
        handleCheckin(c.id, activePartnerIndex === 1);
      }
    });

    const unsub = DataStore.onSync((e) => {
      if (e.type === 'COUPLE_UPDATED') {
        setCouple(e.payload);
      } else if (e.type === 'DAILY_CHECKIN_UPDATED') {
        setDailyCounter(e.payload);
      }
    });
    return unsub;
  }, [loadData, activePartnerIndex, handleCheckin]);

  const switchActiveUser = () => {
    const next = activePartnerIndex === 1 ? 2 : 1;
    setActivePartnerIndex(next);
    localStorage.setItem('two_of_us_active_partner', String(next));
    if (couple) {
      handleCheckin(couple.id, next === 1);
    }
  };

  const triggerCheckin = async () => {
    if (!couple) return;
    await handleCheckin(couple.id, activePartnerIndex === 1);
  };

  const updateCoupleSettings = async (updates: Partial<CoupleSpace>) => {
    if (!couple) return;
    const updated = { ...couple, ...updates };
    setCouple(updated);
    await DataStore.saveCoupleSpace(updated);
  };

  // Strictly enforce that each partner can only update their own profile details
  const updateMyProfile = async (profile: { name?: string; avatar?: string; bio?: string }) => {
    if (!couple) return;
    const isP1 = activePartnerIndex === 1;
    const updates: Partial<CoupleSpace> = isP1
      ? {
          partner1Name: profile.name !== undefined ? profile.name : couple.partner1Name,
          partner1Avatar: profile.avatar !== undefined ? profile.avatar : couple.partner1Avatar,
          partner1Bio: profile.bio !== undefined ? profile.bio : couple.partner1Bio,
        }
      : {
          partner2Name: profile.name !== undefined ? profile.name : couple.partner2Name,
          partner2Avatar: profile.avatar !== undefined ? profile.avatar : couple.partner2Avatar,
          partner2Bio: profile.bio !== undefined ? profile.bio : couple.partner2Bio,
        };
    await updateCoupleSettings(updates);
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
    name: couple?.partner1Name || 'Ayush',
    avatar: couple?.partner1Avatar || '',
    bio: couple?.partner1Bio || 'Adoring boyfriend & puzzle enthusiast. Always smiling when with Vrishti ❤️',
    isPartner1: true,
  };

  const p2: UserProfile = {
    id: 'partner-2',
    name: couple?.partner2Name || 'Vrishti',
    avatar: couple?.partner2Avatar || '',
    bio: couple?.partner2Bio || 'Chief tea drinker, garden master, and Ayush’s favorite human ✨',
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
        dailyCounter,
        switchActiveUser,
        updateCoupleSettings,
        updateMyProfile,
        pairWithInviteCode,
        refreshCouple,
        triggerCheckin,
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
