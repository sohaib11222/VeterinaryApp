import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, type KeyboardEvent, Platform, View } from 'react-native';

type KeyboardFrame = { screenY: number; height: number };

/**
 * Keeps a chat composer above the keyboard without assuming whether Android
 * resized the window or overlaid the keyboard. The measurement is taken from
 * an untransformed composer wrapper, rather than the full screen, so stack
 * headers, safe areas, and tab layouts cannot skew the offset.
 */
export function useChatKeyboardInset() {
  const composerRef = useRef<View>(null);
  const keyboardTopRef = useRef<number | null>(null);
  const syncTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const clearSyncTimers = useCallback(() => {
    syncTimersRef.current.forEach(clearTimeout);
    syncTimersRef.current = [];
  }, []);

  const measureComposer = useCallback((keyboardTop: number) => {
    requestAnimationFrame(() => {
      composerRef.current?.measureInWindow((_x, y, _width, height) => {
        // If Android resized the app window the overlap is already zero. If it
        // overlaid the keyboard, translate exactly the covered part upward.
        const overlap = Math.max(0, Math.round(y + height - keyboardTop));
        const clearance = Platform.OS === 'ios' ? 8 : 12;
        setKeyboardOffset((current) => {
          const next = overlap + clearance;
          return current === next ? current : next;
        });
      });
    });
  }, []);

  const applyKeyboardFrame = useCallback((frame?: Partial<KeyboardFrame>) => {
    const top = Number(frame?.screenY);
    const height = Number(frame?.height);
    if (!Number.isFinite(top) || !Number.isFinite(height) || height <= 0) return;
    keyboardTopRef.current = top;
    measureComposer(top);
  }, [measureComposer]);

  const syncFromKeyboardMetrics = useCallback(() => {
    const metrics = Keyboard.metrics();
    if (metrics) applyKeyboardFrame(metrics);
  }, [applyKeyboardFrame]);

  const onComposerFocus = useCallback(() => {
    // Android can resize the window before the keyboard event reaches JS. A
    // short sequence of metric reads covers both that timing and slow keyboards.
    clearSyncTimers();
    [0, 70, 160, 320, 560].forEach((delay) => {
      syncTimersRef.current.push(setTimeout(syncFromKeyboardMetrics, delay));
    });
  }, [clearSyncTimers, syncFromKeyboardMetrics]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event: KeyboardEvent) => applyKeyboardFrame(event.endCoordinates));
    const hide = Keyboard.addListener(hideEvent, () => {
      clearSyncTimers();
      keyboardTopRef.current = null;
      setKeyboardOffset(0);
    });

    // Covers navigating back into a focused chat while the keyboard is open.
    syncFromKeyboardMetrics();
    return () => {
      clearSyncTimers();
      show.remove();
      hide.remove();
    };
  }, [applyKeyboardFrame, clearSyncTimers, syncFromKeyboardMetrics]);

  return { composerRef, keyboardOffset, onComposerFocus };
}
