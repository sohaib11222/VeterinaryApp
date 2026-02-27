import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface VideoSessionResponse {
  success: boolean;
  message?: string;
  data?: {
    sessionId?: string;
    streamToken?: string;
    streamCallId?: string;
    session?: unknown;
  };
}

export async function startVideoSession(appointmentId: string) {
  return api.post<VideoSessionResponse>(API_ROUTES.VIDEO.CREATE, { appointmentId });
}

export async function endVideoSession(sessionId: string) {
  return api.post<{ success: boolean; message?: string; data?: unknown }>(API_ROUTES.VIDEO.END, { sessionId });
}

export async function getVideoSessionByAppointment(appointmentId: string) {
  return api.get<VideoSessionResponse>(API_ROUTES.VIDEO.BY_APPOINTMENT(appointmentId));
}
