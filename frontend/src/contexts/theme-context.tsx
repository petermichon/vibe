/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'auto';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleAutoTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LIGHT_BG = '#ffffff';
const DARK_BG = '#0d0d0d';

function setMetaThemeColor(isDark: boolean) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? DARK_BG : LIGHT_BG);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || saved === 'light' ? saved : 'auto';
  });

  const [lastManualTheme, setLastManualTheme] = useState<'light' | 'dark'>(
    () => {
      const savedLastManualTheme = localStorage.getItem('last-manual-theme');
      return (savedLastManualTheme as 'light' | 'dark') || 'dark';
    }
  );

  useEffect(() => {
    const root = window.document.documentElement;

    let effectiveTheme: 'light' | 'dark';
    if (theme === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effectiveTheme = theme;
    }

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    setMetaThemeColor(effectiveTheme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const root = window.document.documentElement;
      const effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
      setMetaThemeColor(effectiveTheme === 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  useEffect(() => {
    const updateFavicon = (isDark) => {
      const favicon = document.querySelector(
        'link[rel="icon"]'
      ) as HTMLLinkElement | null;
      if (favicon)
        favicon.href = isDark ? '/favicon-white.svg' : '/favicon-black.svg';
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    updateFavicon(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      updateFavicon(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleAutoTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === 'auto') {
        // When disabling auto, revert to last manual theme
        return lastManualTheme;
      } else {
        // When enabling auto, save current theme as last manual
        setLastManualTheme(prevTheme);
        return 'auto';
      }
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        toggleAutoTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
