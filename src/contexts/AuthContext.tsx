import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { loginApi, registerApi, AuthResponseData } from '../mutations/authMutations';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../api/client';

export type UserRole = 'PET_OWNER' | 'VETERINARIAN' | 'PET_STORE' | 'PARAPHARMACY' | 'ADMIN';

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  isPhoneVerified?: boolean;
}

/** Response from login/register for navigation decisions (role, status) */
export interface AuthResult {
  user: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult | undefined>;
  register: (payload: { name: string; email: string; phone?: string; password: string }, role?: string) => Promise<AuthResult | undefined>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(u: AuthResponseData['user'] | null): User | null {
  if (!u) return null;
  const rawId = u.id ?? (u as { _id?: unknown })._id;
  const id = rawId != null ? String(rawId) : '';
  if (!id) return null;
  const roleRaw = String(u.role ?? 'PET_OWNER').toUpperCase();
  const role = (['PET_OWNER', 'VETERINARIAN', 'PET_STORE', 'PARAPHARMACY', 'ADMIN'].includes(roleRaw) ? roleRaw : 'PET_OWNER') as UserRole;
  const raw = u as { phone?: string; isPhoneVerified?: boolean };
  return {
    id,
    email: u.email ?? '',
    name: u.name ?? '',
    role,
    status: (u.status as User['status']) ?? undefined,
    phone: raw?.phone ?? undefined,
    isPhoneVerified: raw?.isPhoneVerified ?? undefined,
  };
}

async function persistAuth(data: AuthResponseData) {
  const user = normalizeUser(data.user);
  if (data.token) await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
  if (data.refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  if (user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  return user;
}

async function clearAuth() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (!token) {
          setUserState(null);
          return;
        }
        const raw = await SecureStore.getItemAsync(USER_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as User;
            if (!cancelled) setUserState(parsed);
          } catch {
            await clearAuth();
            if (!cancelled) setUserState(null);
          }
        } else {
          await clearAuth();
          if (!cancelled) setUserState(null);
        }
      } catch {
        if (!cancelled) setUserState(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult | undefined> => {
    try {
      const data = await loginApi({ email, password });
      const userFromApi = await persistAuth(data);
      if (userFromApi) {
        setUserState(userFromApi);
        const status = (userFromApi.status ?? '').toUpperCase();
        if (status === 'PENDING') {
          Toast.show({ type: 'info', text1: 'Pending Approval', text2: 'Your account is under review.' });
        } else if (status === 'REJECTED' || status === 'BLOCKED') {
          Toast.show({ type: 'error', text1: 'Account Not Active', text2: 'Your account was rejected or blocked. Please contact support.' });
        } else {
          Toast.show({ type: 'success', text1: 'Login Successful', text2: `Welcome back, ${userFromApi.name || userFromApi.email}!` });
        }
        return { user: userFromApi };
      }
      return undefined;
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Login failed. Please check your credentials.';
      Toast.show({ type: 'error', text1: 'Login Failed', text2: message });
      throw err;
    }
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; phone?: string; password: string }, role?: string): Promise<AuthResult | undefined> => {
      try {
        const backendRole = (role as User['role']) || 'PET_OWNER';
        const data = await registerApi({
          ...payload,
          role: backendRole,
        });
        const userFromApi = await persistAuth(data);
        if (userFromApi) {
          setUserState(userFromApi);
          Toast.show({ type: 'success', text1: 'Registration Successful', text2: 'Account created successfully!' });
          return { user: userFromApi };
        }
        return undefined;
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message ?? 'Registration failed. Please try again.';
        Toast.show({ type: 'error', text1: 'Registration Failed', text2: message });
        throw err;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await clearAuth();
    setUserState(null);
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUserState((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...partial };
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
