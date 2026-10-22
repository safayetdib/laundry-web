'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useLogin, useLogout, useMe } from '@/lib/api/hooks';
import type { Role, UserDTO } from '@/lib/api/types';

interface AuthContextValue {
  user: UserDTO | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<UserDTO>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const me = useMe();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const user = me.data?.user ?? null;

  const value: AuthContextValue = {
    user,
    isLoading: me.isLoading,
    login: async (phone, password) => {
      const result = await loginMutation.mutateAsync({ phone, password });
      return result.user;
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    hasRole: (...roles) => !!user && roles.some((r) => user.roles.includes(r)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
