import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutOptions {
  /** Require Cmd (Mac) or Ctrl (Windows/Linux) */
  meta?: boolean;
  /** Require Ctrl key */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
  /** Enable/disable the shortcut (default: true) */
  enabled?: boolean;
  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean;
}

/**
 * Hook for handling keyboard shortcuts
 * 
 * @param key - The key to listen for (e.g., 'k', 'Escape', 'Enter')
 * @param callback - Function to call when shortcut is triggered
 * @param options - Modifier keys and options
 * 
 * @example
 * // Cmd+K (Mac) or Ctrl+K (Windows) to open search
 * useKeyboardShortcut('k', () => setSearchOpen(true), { meta: true });
 * 
 * @example
 * // Escape to close modal
 * useKeyboardShortcut('Escape', handleClose, { enabled: isOpen });
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    meta = false,
    ctrl = false,
    shift = false,
    alt = false,
    enabled = true,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if shortcut is disabled
      if (!enabled) return;

      // Skip if target is an input/textarea (unless it's Escape)
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      
      if (isInput && key !== 'Escape') return;

      // Check key match (case-insensitive for letter keys)
      const keyMatch =
        event.key.toLowerCase() === key.toLowerCase() ||
        event.code === key ||
        event.code === `Key${key.toUpperCase()}`;

      if (!keyMatch) return;

      // Check meta key (Cmd on Mac, Ctrl on Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaPressed = isMac ? event.metaKey : event.ctrlKey;
      if (meta && !metaPressed) return;
      if (!meta && metaPressed && !ctrl) return; // Prevent accidental triggers

      // Check other modifiers
      if (ctrl && !event.ctrlKey) return;
      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;

      // Prevent accidental triggers when modifiers are pressed but not required
      if (!shift && event.shiftKey) return;
      if (!alt && event.altKey) return;

      // All conditions met - trigger callback
      if (preventDefault) {
        event.preventDefault();
      }
      callback();
    },
    [key, callback, meta, ctrl, shift, alt, enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
