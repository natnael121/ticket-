// @refresh reset
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { getTelegramUser } from '../services/telegramService';
import { mockDataService } from '../services/mockDataService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isSuperAdmin: boolean;
  setRole: (role: UserRole) => void;
  organizationId: string | null;
  setOrganizationId: (orgId: string | null) => void;
  telegramAuth: (telegramData?: any) => void;
  switchUserRole: (targetRole: UserRole, targetOrgId?: string) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('customer');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const tgUser = getTelegramUser();

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (tgUser) {
      const isInitialSA = mockDataService.isSuperAdmin(tgUser.id, tgUser.username);
      const tgProfile: UserProfile = {
        uid: `tg_${tgUser.id}`,
        email: `${tgUser.username || tgUser.id}@telegram.user`,
        fullName: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        phone: '',
        telegramUserId: String(tgUser.id),
        telegramUsername: tgUser.username,
        role: isInitialSA ? 'super_admin' : 'customer',
        createdAt: new Date().toISOString()
      };
      return mockDataService.upsertUserProfile(tgProfile);
    }
    return null;
  });

  // Calculate whether currently authenticated user has Super Admin authority
  const isSuperAdmin = (() => {
    try {
      return Boolean(
        user && mockDataService.isSuperAdmin(user.telegramUserId, user.telegramUsername)
      );
    } catch {
      return false;
    }
  })();

  // Subscribe to real-time updates from Firestore / mockDataService
  useEffect(() => {
    const unsubscribe = mockDataService.subscribe(() => {
      setTick((t) => t + 1);
      if (user) {
        const freshUser = mockDataService.getUserProfile(user.uid);
        if (freshUser) {
          setUser(freshUser);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user && user.organizationId && !organizationId) {
      setOrganizationId(user.organizationId);
    }
    if (user && isSuperAdmin && role === 'customer') {
      setRoleState('super_admin');
    }
  }, [user, isSuperAdmin]);

  const setRole = (newRole: UserRole) => {
    if (newRole === 'super_admin' && !isSuperAdmin) {
      console.warn('Unauthorized attempt to switch to super_admin role denied.');
      return;
    }
    setRoleState(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      mockDataService.upsertUserProfile(updated);
    }
  };

  const telegramAuth = (customTgUser?: any) => {
    const activeTg = customTgUser || tgUser;
    if (!activeTg) return;

    const isAuthorizedSA = mockDataService.isSuperAdmin(activeTg.id, activeTg.username);
    const assignedRole: UserRole = isAuthorizedSA ? 'super_admin' : activeTg.role || 'customer';

    const profile: UserProfile = {
      uid: `tg_${activeTg.id || Date.now()}`,
      email: `${activeTg.username || activeTg.id || 'user'}@telegram.user`,
      fullName: `${activeTg.first_name || 'Telegram'} ${activeTg.last_name || 'User'}`.trim(),
      phone: activeTg.phone || '',
      telegramUserId: String(activeTg.id || Date.now()),
      telegramUsername: activeTg.username,
      role: assignedRole,
      organizationId: activeTg.organizationId,
      createdAt: new Date().toISOString()
    };

    setUser(profile);
    setRoleState(assignedRole);
    if (profile.organizationId) {
      setOrganizationId(profile.organizationId);
    }
    mockDataService.upsertUserProfile(profile);
  };

  const switchUserRole = (targetRole: UserRole, targetOrgId?: string) => {
    if (targetRole === 'super_admin' && !isSuperAdmin) {
      console.warn('Unauthorized role switch to super_admin rejected.');
      return;
    }

    setRoleState(targetRole);
    if (user) {
      const updated = {
        ...user,
        role: targetRole,
        organizationId: targetOrgId || user.organizationId
      };
      setUser(updated);
      mockDataService.upsertUserProfile(updated);
    } else {
      const isGuestSA = mockDataService.isSuperAdmin(undefined, undefined);
      if (targetRole === 'super_admin' && !isGuestSA) {
        return;
      }
      const guestProfile: UserProfile = {
        uid: `tg_guest_${Date.now()}`,
        email: `guest_${Date.now()}@telegram.user`,
        fullName: `Telegram User`,
        phone: '',
        telegramUserId: String(Date.now()),
        role: targetRole,
        organizationId: targetOrgId,
        createdAt: new Date().toISOString()
      };
      setUser(guestProfile);
      mockDataService.upsertUserProfile(guestProfile);
    }
    if (targetOrgId) {
      setOrganizationId(targetOrgId);
    }
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...profile };
      setUser(updated);
      mockDataService.upsertUserProfile(updated);
    }
  };

  const logout = () => {
    setUser(null);
    setOrganizationId(null);
    setRoleState('customer');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isSuperAdmin,
        setRole,
        organizationId,
        setOrganizationId,
        telegramAuth,
        switchUserRole,
        updateUserProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
