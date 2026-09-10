import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { getTelegramUser } from '../services/telegramService';
import { mockDataService } from '../services/mockDataService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
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

  const tgUser = getTelegramUser();

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (tgUser) {
      const tgProfile: UserProfile = {
        uid: `tg_${tgUser.id}`,
        email: `${tgUser.username || tgUser.id}@telegram.user`,
        fullName: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        phone: '',
        telegramUserId: String(tgUser.id),
        telegramUsername: tgUser.username,
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      return mockDataService.upsertUserProfile(tgProfile);
    }
    return null;
  });

  useEffect(() => {
    if (user && user.organizationId && !organizationId) {
      setOrganizationId(user.organizationId);
    }
  }, [user]);

  const setRole = (newRole: UserRole) => {
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

    const profile: UserProfile = {
      uid: `tg_${activeTg.id || Date.now()}`,
      email: `${activeTg.username || activeTg.id || 'user'}@telegram.user`,
      fullName: `${activeTg.first_name || 'Telegram'} ${activeTg.last_name || 'User'}`.trim(),
      phone: activeTg.phone || '',
      telegramUserId: String(activeTg.id || Date.now()),
      telegramUsername: activeTg.username,
      role: activeTg.role || 'customer',
      organizationId: activeTg.organizationId,
      createdAt: new Date().toISOString()
    };

    setUser(profile);
    setRoleState(profile.role);
    if (profile.organizationId) {
      setOrganizationId(profile.organizationId);
    }
    mockDataService.upsertUserProfile(profile);
  };

  const switchUserRole = (targetRole: UserRole, targetOrgId?: string) => {
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
      // Create guest Telegram user
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
