export type ReminderNotification = {
  _id: string;
  type?: string;
  title?: string;
  body?: string;
  isRead?: boolean;
};

/** Normalizes the nested notification response used by all role dashboards. */
export function getUnreadReminders(payload: unknown): ReminderNotification[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const data = (outer as { data?: unknown })?.data ?? outer;
  const list = (data as { notifications?: unknown[] })?.notifications;
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => item as Record<string, unknown>)
    .filter((item) => item && item.isRead !== true && typeof item._id === 'string')
    .map((item) => ({
      _id: String(item._id),
      type: String(item.type ?? ''),
      title: String(item.title ?? ''),
      body: String(item.body ?? ''),
      isRead: Boolean(item.isRead),
    }));
}

export function remindersFor(reminders: ReminderNotification[], terms: string[]): ReminderNotification[] {
  const normalizedTerms = terms.map((term) => term.toUpperCase());
  return reminders.filter((item) => {
    const searchable = `${item.type ?? ''} ${item.title ?? ''} ${item.body ?? ''}`.toUpperCase();
    return normalizedTerms.some((term) => searchable.includes(term));
  });
}

