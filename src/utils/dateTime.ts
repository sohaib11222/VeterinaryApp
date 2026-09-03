/** A clear, compact timestamp for notification cards: `Today · 08:45 PM` or `03 Sep 2026 · 08:45 PM`. */
export function formatNotificationDateTime(value?: string, locale?: string): string {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const now = new Date();
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return `Today · ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })} · ${time}`;
}
