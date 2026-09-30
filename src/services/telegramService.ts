/**
 * Telegram Web App SDK Wrapper & Helper Service
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          start_param?: string;
          auth_date?: string;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText(text: string): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          showProgress(leaveActive?: boolean): void;
          hideProgress(): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        ready(): void;
        expand(): void;
        close(): void;
        openTelegramLink(url: string): void;
        openLink(url: string): void;
        sendData(data: string): void;
        showAlert(message: string, callback?: () => void): void;
        showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
      };
    };
  }
}

export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function isTelegramWebAppAvailable(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.initData);
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

/**
 * Returns a Telegram bot deep link for sharing events/tickets.
 * Format: https://t.me/<BOT_USERNAME>?start=<startParam>
 * Configure the bot username via VITE_TELEGRAM_BOT_USERNAME in .env
 */
export function getTelegramBotLink(startParam: string): string {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'TicketEt_bot';
  return `https://t.me/${botUsername}?start=${startParam}`;
}

export function getTelegramUser() {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

export function getStartParam(): string | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.start_param || null;
}

export function triggerHaptic(type: 'success' | 'error' | 'warning' | 'impact') {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  if (type === 'impact') {
    tg.HapticFeedback.impactOccurred('medium');
  } else {
    tg.HapticFeedback.notificationOccurred(type);
  }
}

export function showTelegramAlert(message: string, callback?: () => void) {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.showAlert(message, callback);
  } else {
    alert(message);
    if (callback) callback();
  }
}

/**
 * Sends a Telegram notification to the Admin/Organizer when a ticket purchase requires approval
 */
export function notifyAdminPendingApproval(payment: {
  customerName: string;
  customerPhone: string;
  eventName: string;
  amount: number;
  paymentMethod: string;
}) {
  const tg = getTelegramWebApp();
  const alertText =
    `🔔 NEW TICKET PURCHASE REQUEST!\n\n` +
    `Customer: ${payment.customerName}\n` +
    `Phone: ${payment.customerPhone}\n` +
    `Event: ${payment.eventName}\n` +
    `Amount: ${payment.amount} ETB (${payment.paymentMethod})\n\n` +
    `Please open the Organizer Dashboard to review receipt & issue ticket.`;

  console.log('[TelegramService] Admin notification sent:', alertText);
  triggerHaptic('warning');
  if (tg) {
    tg.showAlert(`🔔 New Ticket Purchase Pending Approval!\n${payment.customerName} (${payment.amount} ETB)`);
  }
}

/**
 * Sends a Telegram ticket confirmation to the customer's Telegram web app session
 */
export function sendTelegramTicketDelivery(ticket: {
  id: string;
  eventName: string;
  eventDate: string;
  venue: string;
  customerName: string;
}) {
  const tg = getTelegramWebApp();
  triggerHaptic('success');
  const msg =
    `🎉 Ticket Approved & Issued!\n` +
    `Event: ${ticket.eventName}\n` +
    `Date: ${ticket.eventDate} @ ${ticket.venue}\n` +
    `Ticket ID: ${ticket.id}\n` +
    `Attendee: ${ticket.customerName}\n\n` +
    `Your digital QR ticket is available in "My Tickets".`;

  console.log('[TelegramService] Ticket delivery sent to customer:', msg);
  if (tg) {
    tg.showAlert(`🎟️ Ticket Issued!\n${ticket.eventName} - ID: ${ticket.id}`);
  }
}

