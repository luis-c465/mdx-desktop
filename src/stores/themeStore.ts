/**
 * Theme store - manages application theme (light/dark/system)
 * Persists user preference to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  /** User's theme preference */
  theme: Theme;
  
  /** 
   * Set the theme and apply to DOM
   * @param theme - 'light', 'dark', or 'system'
   */
  setTheme: (theme: Theme) => void;
}

/**
 * Apply theme to document root element
 * @param theme - Theme to apply
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    // Follow system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    // Apply explicit theme
    root.classList.toggle('dark', theme === 'dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      
      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    {
      name: 'mdx-theme-storage', // localStorage key
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration from localStorage
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Initialize theme on load (for first render before hydration)
if (typeof window !== 'undefined') {
  // Try to get stored theme
  try {
    const stored = localStorage.getItem('mdx-theme-storage');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state && state.theme) {
        applyTheme(state.theme);
      }
    } else {
      // No stored preference, apply system default
      applyTheme('system');
    }
  } catch (error) {
    console.error('Failed to parse stored theme:', error);
    applyTheme('system');
  }
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    const currentTheme = useThemeStore.getState().theme;
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleSystemThemeChange);
  }
}
