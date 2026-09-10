import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getTelegramWebApp,
  isTelegramWebAppAvailable,
  initTelegramApp,
  triggerHaptic,
  showTelegramAlert
} from '../services/telegramService';

interface TelegramContextType {
  isAvailable: boolean;
  tgUser: any;
  colorScheme: 'light' | 'dark';
  triggerHaptic: (type: 'success' | 'error' | 'warning' | 'impact') => void;
  showAlert: (message: string, callback?: () => void) => void;
  expandApp: () => void;
  closeApp: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [tgUser, setTgUser] = useState<any>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const available = isTelegramWebAppAvailable();
    setIsAvailable(available);

    if (available) {
      initTelegramApp();
      const tg = getTelegramWebApp();
      if (tg) {
        setTgUser(tg.initDataUnsafe?.user || null);
        setColorScheme(tg.colorScheme || 'dark');
      }
    }
  }, []);

  const expandApp = () => {
    const tg = getTelegramWebApp();
    tg?.expand();
  };

  const closeApp = () => {
    const tg = getTelegramWebApp();
    tg?.close();
  };

  return (
    <TelegramContext.Provider
      value={{
        isAvailable,
        tgUser,
        colorScheme,
        triggerHaptic,
        showAlert: showTelegramAlert,
        expandApp,
        closeApp
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};
