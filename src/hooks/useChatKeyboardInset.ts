import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, type KeyboardEvent, type LayoutChangeEvent, Platform, View } from 'react-native';

/**
 * Android uses `adjustPan` for chat screens, so the keyboard always overlays
 * the window and its reported height is the exact composer offset. This avoids
 * the mixed resize/overlay measurements that left part of the composer hidden
 * on edge-to-edge Android devices.
 */
export function useChatKeyboardInset() {
  const containerRef = useRef<View>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const handleKeyboardFrame = useCallback((event: KeyboardEvent) => {
    const height = Number(event.endCoordinates?.height);
    const isVisible = Number.isFinite(height) && height > 0;
    setKeyboardVisible(isVisible);
    if (!isVisible) {
      setKeyboardInset(0);
      return;
    }
    setKeyboardInset(Math.ceil(height));
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, handleKeyboardFrame);
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardInset(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [handleKeyboardFrame]);

  const onLayout = useCallback((_event: LayoutChangeEvent) => {}, []);

  // Clearance keeps the whole composer border above gesture-navigation and
  // keyboard edge rounding on every device.
  const composerInset = keyboardVisible ? keyboardInset + (Platform.OS === 'ios' ? 8 : 12) : 0;
  return { containerRef, keyboardInset: composerInset, keyboardVisible, onLayout };
}
