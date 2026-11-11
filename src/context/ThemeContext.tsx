import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPartner1Active, couple, updateCoupleSettings } = useAuth();
  const partnerKey = isPartner1Active ? '1' : '2';

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const activePartner = localStorage.getItem('two_of_us_active_partner') || '1';
      const stored = localStorage.getItem(`two_of_us_theme_partner_${activePartner}`) ||
                     localStorage.getItem('two_of_us_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  // When active partner switches, restore that partner's saved theme preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`two_of_us_theme_partner_${partnerKey}`);
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved);
      } else if (couple) {
        // Fallback to couple space saved preference if available
        const cloudPref = isPartner1Active ? couple.partner1Theme : couple.partner2Theme;
        if (cloudPref === 'dark' || cloudPref === 'light') {
          setThemeState(cloudPref);
        }
      }
    } catch {}
  }, [partnerKey, isPartner1Active, couple]);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(`two_of_us_theme_partner_${partnerKey}`, theme);
      localStorage.setItem('two_of_us_theme', theme);
    } catch {}
  }, [theme, partnerKey]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(`two_of_us_theme_partner_${partnerKey}`, newTheme);
      localStorage.setItem('two_of_us_theme', newTheme);
      // Persist to couple settings for cross-device synchronization
      if (updateCoupleSettings) {
        if (isPartner1Active) {
          updateCoupleSettings({ partner1Theme: newTheme });
        } else {
          updateCoupleSettings({ partner2Theme: newTheme });
        }
      }
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
