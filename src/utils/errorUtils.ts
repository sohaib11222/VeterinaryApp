/**
 * Normalize API errors for display (align with VeterinaryFrontend + backend sendError).
 * Backend: sendError(res, message, statusCode, errors?) => { success: false, message, errors? }
 * Client rejects with { status, message, data } where data = response.data.
 */
export interface ApiErrorShape {
  message?: string;
  data?: {
    message?: string;
    errors?: Record<string, string> | string[];
  };
}

/** Single user-facing message from any thrown error */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err == null) return fallback;
  const o = err as ApiErrorShape & { message?: string };
  // Our client rejects with { message, data }
  if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
  if (o.data && typeof (o.data as { message?: string }).message === 'string') {
    const m = (o.data as { message: string }).message.trim();
    if (m) return m;
  }
  if (typeof (err as Error).message === 'string' && (err as Error).message.trim())
    return (err as Error).message.trim();
  return fallback;
}

/** Field-level errors from backend (e.g. validation). data.errors can be object or array of messages */
export function getFieldErrors(err: unknown): Record<string, string> {
  const o = err as { data?: { errors?: Record<string, string> | string[] } };
  const errors = o?.data?.errors;
  if (!errors) return {};
  if (Array.isArray(errors)) {
    return { _form: errors[0] ?? '' };
  }
  return typeof errors === 'object' && errors !== null ? (errors as Record<string, string>) : {};
}
