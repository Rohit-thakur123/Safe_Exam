import { useEffect } from 'react';

interface ShortcutOptions {
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export function useKeyboardShortcut(key: string, callback: () => void, options: ShortcutOptions = {}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== key) return;
      if (options.ctrlKey && !event.ctrlKey) return;
      if (options.altKey && !event.altKey) return;
      if (options.shiftKey && !event.shiftKey) return;
      event.preventDefault();
      callback();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callback, key, options.altKey, options.ctrlKey, options.shiftKey]);
}
