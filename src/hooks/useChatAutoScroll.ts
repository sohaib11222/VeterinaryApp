import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { FlatList, LayoutChangeEvent } from 'react-native';

type ChatListItem = { _id?: string; id?: string };

/**
 * Brings a conversation to its latest item only after FlatList has mounted
 * and measured it. Initial data, late image sizing, polling updates, and a
 * keyboard-driven bottom inset all get their own settled scroll pass.
 */
export function useChatAutoScroll<T extends ChatListItem>(
  listRef: RefObject<FlatList<T> | null>,
  conversationId: string | null | undefined,
  messages: T[],
  loading: boolean,
  bottomInset = 0
) {
  const initializedRef = useRef(false);
  const pendingInitialScrollRef = useRef(false);
  const lastMessageKeyRef = useRef('');
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const newest = messages[messages.length - 1];
  const newestKey = messages.length ? String(newest?._id ?? newest?.id ?? messages.length) : '';

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, [listRef]);

  const scheduleScroll = useCallback((animated: boolean, delays: number[]) => {
    delays.forEach((delay) => {
      timersRef.current.push(setTimeout(() => scrollToLatest(animated), delay));
    });
  }, [scrollToLatest]);

  useEffect(() => {
    initializedRef.current = false;
    pendingInitialScrollRef.current = false;
    lastMessageKeyRef.current = '';
    clearTimers();
  }, [clearTimers, conversationId]);

  useEffect(() => {
    if (loading || messages.length === 0) return;

    const initial = !initializedRef.current;
    const hasNewMessage = !initial && newestKey !== lastMessageKeyRef.current;
    if (!initial && !hasNewMessage) return;

    initializedRef.current = true;
    pendingInitialScrollRef.current = initial;
    lastMessageKeyRef.current = newestKey;
    clearTimers();
    scheduleScroll(!initial, initial ? [0, 70, 180, 420, 800] : [0, 80, 220]);

    if (initial) {
      timersRef.current.push(setTimeout(() => {
        pendingInitialScrollRef.current = false;
      }, 1200));
    }
  }, [clearTimers, loading, messages.length, newestKey, scheduleScroll]);

  useEffect(() => {
    if (messages.length === 0 || bottomInset <= 0) return;
    scheduleScroll(false, [0, 80, 180]);
  }, [bottomInset, messages.length, scheduleScroll]);

  const onContentSizeChange = useCallback(() => {
    if (pendingInitialScrollRef.current) scheduleScroll(false, [0, 70]);
  }, [scheduleScroll]);

  const onListLayout = useCallback((_event: LayoutChangeEvent) => {
    if (pendingInitialScrollRef.current) scheduleScroll(false, [0, 70]);
  }, [scheduleScroll]);

  useEffect(() => clearTimers, [clearTimers]);

  return { scrollToLatest, onContentSizeChange, onListLayout };
}
