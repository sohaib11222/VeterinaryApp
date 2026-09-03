export const SUPPORT_CATEGORIES = [
  ['APPOINTMENT', 'Appointment issue'],
  ['RESCHEDULE', 'Reschedule issue'],
  ['VIDEO_CALL', 'Video call issue'],
  ['PAYMENT', 'Payment issue'],
  ['PHARMACY_ORDER', 'Pharmacy order issue'],
  ['PARAPHARMACY_ORDER', 'Parapharmacy order issue'],
  ['DELIVERY', 'Delivery issue'],
  ['REFUND', 'Refund issue'],
  ['PRESCRIPTION', 'Prescription issue'],
  ['ACCOUNT_REGISTRATION', 'Account / registration issue'],
  ['PET_PROFILE', 'Pet profile issue'],
  ['VETERINARIAN', 'Doctor / veterinarian issue'],
  ['TECHNICAL', 'Technical issue'],
  ['OTHER', 'Other'],
] as const;

export const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_PATIENT', 'RESOLVED', 'CLOSED'] as const;
export const SUPPORT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export type SupportStatus = typeof SUPPORT_STATUSES[number];
export type SupportPriority = typeof SUPPORT_PRIORITIES[number];

export const supportLabel = (value: string | null | undefined) =>
  String(value || '—')
    .toLowerCase()
    .split('_')
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : '')
    .join(' ');
