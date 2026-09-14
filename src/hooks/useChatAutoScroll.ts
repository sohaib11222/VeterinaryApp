import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { InteractionManager, type LayoutChangeEvent, type FlatList } from 'react-native';

type ChatListItem = { _id?: string; id?: string };

/** Keeps a newly opened conversation and subsequent new messages at the latest item. */
export function useChatAutoScroll<T extends ChatListItem>(
  listRef: RefObject<FlatList<T> | null>,
  conversationId: string | null | undefined,
  messages: T[],
  loading: boolean
) {
  const initializedRef = useRef(false);
  const pendingInitialScrollRef = useRef(false);
  const lastMessageKeyRef = useRef('');
  const initialTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, [listRef]);

  const scheduleInitialScroll = useCallback(() => {
    initialTimersRef.current.forEach(clearTimeout);
    initialTimersRef.current = [0, 90, 260, 520].map((delay) => setTimeout(() => scrollToLatest(false), delay));
    InteractionManager.runAfterInteractions(() => scrollToLatest(false));
  }, [scrollToLatest]);

  useEffect(() => {
    initializedRef.current = false;
    pendingInitialScrollRef.current = false;
    lastMessageKeyRef.current = '';
  }, [conversationId]);

  useEffect(() => {
    if (loading || messages.length === 0) return;
    const newest = messages[messages.length - 1];
    const newestKey = String(newest?._id ?? newest?.id ?? messages.length);
    const initial = !initializedRef.current;
    const hasNewMessage = !initial && newestKey !== lastMessageKeyRef.current;
    if (!initial && !hasNewMessage) return;

    initializedRef.current = true;
    pendingInitialScrollRef.current = initial;
    lastMessageKeyRef.current = newestKey;
    if (initial) {
      scheduleInitialScroll();
      const settleTimer = setTimeout(() => { pendingInitialScrollRef.current = false; }, 650);
      return () => clearTimeout(settleTimer);
    }
    scrollToLatest(true);
  }, [loading, messages, scheduleInitialScroll, scrollToLatest]);

  const onContentSizeChange = useCallback(() => {
    if (!pendingInitialScrollRef.current) return;
    scrollToLatest(false);
  }, [scrollToLatest]);

  const onListLayout = useCallback((_event: LayoutChangeEvent) => {
    if (!pendingInitialScrollRef.current) return;
    scheduleInitialScroll();
  }, [scheduleInitialScroll]);

  useEffect(() => () => initialTimersRef.current.forEach(clearTimeout), []);

  return { scrollToLatest, onContentSizeChange, onListLayout };
}
