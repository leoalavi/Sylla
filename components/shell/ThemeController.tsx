'use client';

import { useEffect } from 'react';
import { settingsStore } from '@/lib/sylla/stores/settings';

/**
 * Keeps the `.dark` class on <html> in sync with Settings → Appearance and
 * the OS preference. First paint is handled by the inline script in
 * app/layout.tsx (same logic) so there is no theme flash.
 */
export function ThemeController() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const { theme } = settingsStore.get();
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };

    apply();
    const unsubscribe = settingsStore.subscribe(apply);
    media.addEventListener('change', apply);
    return () => {
      unsubscribe();
      media.removeEventListener('change', apply);
    };
  }, []);

  return null;
}

/** Inline no-flash script (stringified into <head> by the root layout). */
export const themeInitScript = `(function(){try{var s=JSON.parse(localStorage.getItem('sylla:v1:settings')||'{}');var t=s.theme||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
