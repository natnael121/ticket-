/**
 * GeezSMS Integration Service
 * Dispatches automated SMS confirmations for approved and free tickets.
 * API Endpoint: https://api.geezsms.com/api/v1/sms/send
 */

import { DigitalTicket } from '../types';
import { getTelegramBotLink } from './telegramService';

const GEEZSMS_ENDPOINT =
  import.meta.env.VITE_GEEZSMS_ENDPOINT || 'https://api.geezsms.com/api/v1/sms/send';

const GEEZSMS_API_KEY =
  import.meta.env.VITE_GEEZSMS_API_KEY || 'GEEZSMS_API_KEY_FALLBACK';

/**
 * Clean and format phone number for GeezSMS (e.g. +251911234567 or 0911234567)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('09')) {
    cleaned = '251' + cleaned.substring(1);
  } else if (cleaned.startsWith('07')) {
    cleaned = '251' + cleaned.substring(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export interface GeezSmsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Sends an SMS via the GeezSMS API
 */
export async function sendGeezSMS(phone: string, message: string): Promise<GeezSmsResponse> {
  const formattedPhone = formatPhoneNumber(phone);
  console.log(`[GeezSMS] Sending SMS to ${formattedPhone}...`);

  try {
    // Attempt JSON payload
    const response = await fetch(GEEZSMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: GEEZSMS_API_KEY,
        key: GEEZSMS_API_KEY,
        phone: formattedPhone,
        to: formattedPhone,
        msg: message,
        message: message
      })
    });

    const data = await response.json();
    console.log('[GeezSMS] API Response:', data);

    if (response.ok && (data.status === 'success' || data.success || data.code === 200)) {
      return { success: true, message: 'SMS sent successfully', data };
    }

    // Fallback: URLSearchParams / Form Data
    const formData = new URLSearchParams();
    formData.append('token', GEEZSMS_API_KEY);
    formData.append('phone', formattedPhone);
    formData.append('msg', message);

    const formResponse = await fetch(GEEZSMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const formDataRes = await formResponse.json();
    console.log('[GeezSMS] Form Response:', formDataRes);

    return {
      success: formResponse.ok,
      message: formDataRes.message || 'SMS processed',
      data: formDataRes
    };
  } catch (error: any) {
    console.error('[GeezSMS] Error sending SMS:', error);
    return {
      success: false,
      message: error.message || 'Failed to communicate with GeezSMS API'
    };
  }
}

/**
 * Helper to construct and send a SMS ticket notification for an issued digital ticket
 */
export async function sendTicketSmsNotification(ticket: DigitalTicket): Promise<GeezSmsResponse> {
  const ticketUrl = getTelegramBotLink(`event_${ticket.eventId}`);

  const message =
    `🎟️ TicketEt Confirmation!\n` +
    `Your ticket for "${ticket.eventName}" (${ticket.eventDate} at ${ticket.venue}) is ready!\n` +
    `Ticket ID: ${ticket.id}\n` +
    `Attendee: ${ticket.customerName}\n` +
    `View pass: ${ticketUrl}`;

  return sendGeezSMS(ticket.customerPhone, message);
}
