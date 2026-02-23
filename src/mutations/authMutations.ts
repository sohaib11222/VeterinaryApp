/**
 * Auth mutations – login, register, change password, etc.
 * Token/user persistence is handled in AuthContext (SecureStore).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'PET_OWNER' | 'VETERINARIAN' | 'PET_STORE' | 'PARAPHARMACY';
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

/** Backend success response envelope */
export interface AuthResponseData {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status?: string;
  };
  token: string;
  refreshToken: string;
}

export interface BackendSuccess<T = AuthResponseData> {
  success: true;
  message: string;
  data: T;
}

/** Raw API calls for use by AuthContext or mutations. Returns the inner data (user, token, refreshToken). */
export async function loginApi(payload: LoginPayload): Promise<AuthResponseData> {
  const res = await api.post<BackendSuccess<AuthResponseData>>(API_ROUTES.AUTH.LOGIN, payload);
  const envelope = res as BackendSuccess<AuthResponseData>;
  const data = envelope?.data ?? (res as unknown as AuthResponseData);
  return data;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponseData> {
  const res = await api.post<BackendSuccess<AuthResponseData>>(API_ROUTES.AUTH.REGISTER, payload);
  const envelope = res as BackendSuccess<AuthResponseData>;
  const data = envelope?.data ?? (res as unknown as AuthResponseData);
  return data;
}

/** useMutation: login – does not persist token; AuthContext does that after calling this */
export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

/** useMutation: register – does not persist token; AuthContext does that after calling this */
export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

/** useMutation: change password (authenticated) */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      api.post<BackendSuccess>(API_ROUTES.AUTH.CHANGE_PASSWORD, payload),
  });
}

/** Forgot password – backend may not send email in dev; still show success */
export async function forgotPasswordApi(email: string) {
  await api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });
}
