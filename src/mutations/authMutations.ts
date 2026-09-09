/**
 * Auth mutations – login, register, change password, etc.
 * Token/user persistence is handled in AuthContext (SecureStore).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';
import { uploadPetSitterRegistration } from '../services/upload';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'PET_OWNER' | 'VETERINARIAN' | 'PET_STORE' | 'PARAPHARMACY' | 'PET_SITTER';
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
    profileImage?: string;
    role: string;
    status?: string;
    isPhoneVerified?: boolean;
  };
  token: string;
  refreshToken: string;
}

export interface EmailVerificationPendingResponse {
  requiresEmailVerification: true;
  email: string;
  user: AuthResponseData['user'];
}

export type RegisterResponse = AuthResponseData | EmailVerificationPendingResponse;

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

export function requiresEmailVerification(data: RegisterResponse): data is EmailVerificationPendingResponse {
  return (data as EmailVerificationPendingResponse)?.requiresEmailVerification === true;
}

export async function registerApi(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await api.post<BackendSuccess<RegisterResponse>>(API_ROUTES.AUTH.REGISTER, payload);
  const envelope = res as BackendSuccess<RegisterResponse>;
  const data = envelope?.data ?? (res as unknown as RegisterResponse);
  return data;
}

/** Pet sitter registration is multipart because the existing backend requires a profile image. */
export async function registerPetSitterApi(formData: FormData): Promise<RegisterResponse> {
  const res = await uploadPetSitterRegistration(formData);
  const envelope = res as BackendSuccess<RegisterResponse>;
  return envelope?.data ?? (res as unknown as RegisterResponse);
}

export async function verifyEmailApi(email: string, code: string): Promise<AuthResponseData> {
  const res = await api.post<BackendSuccess<AuthResponseData>>(API_ROUTES.AUTH.VERIFY_EMAIL, { email, code });
  const envelope = res as BackendSuccess<AuthResponseData>;
  return envelope?.data ?? (res as unknown as AuthResponseData);
}

export async function resendEmailVerificationApi(email: string) {
  await api.post<BackendSuccess>(API_ROUTES.AUTH.RESEND_EMAIL_VERIFICATION, { email });
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

/** Authenticated password-change flow shared with the web application. */
export async function requestChangePasswordCodeApi() {
  await api.post<BackendSuccess>(API_ROUTES.AUTH.REQUEST_CHANGE_PASSWORD_CODE);
}

export async function verifyChangePasswordCodeApi(code: string) {
  await api.post<BackendSuccess<{ verified?: boolean }>>(API_ROUTES.AUTH.VERIFY_CHANGE_PASSWORD_CODE, { code });
}

export async function changePasswordWithCodeApi(code: string, newPassword: string) {
  await api.post<BackendSuccess>(API_ROUTES.AUTH.CHANGE_PASSWORD, { code, newPassword });
}

export async function verifyResetCodeApi(email: string, code: string) {
  await api.post(API_ROUTES.AUTH.VERIFY_RESET_CODE, { email, code });
}

export async function resetPasswordApi(email: string, code: string, newPassword: string) {
  await api.post(API_ROUTES.AUTH.RESET_PASSWORD, { email, code, newPassword });
}

/** Send OTP to phone (pharmacy/parapharmacy). Body: { phone?: string } */
export async function sendPhoneOtpApi(payload: { phone?: string }) {
  await api.post(API_ROUTES.AUTH.SEND_PHONE_OTP, payload);
}

/** Verify phone OTP. Body: { code: string; phone?: string }. Returns backend response (may include user). */
export async function verifyPhoneOtpApi(payload: { code: string; phone?: string }) {
  const res = await api.post<BackendSuccess<{ user?: AuthResponseData['user'] }>>(API_ROUTES.AUTH.VERIFY_PHONE_OTP, payload);
  const envelope = res as BackendSuccess<{ user?: AuthResponseData['user'] }>;
  return envelope?.data ?? (res as unknown as { user?: AuthResponseData['user'] });
}
