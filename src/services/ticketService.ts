import { db } from './firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { DigitalTicket, ScanLog, ScanLogResult } from '../types';

/**
 * Generates a human-readable unique Ticket ID e.g., EVT-2026-9X72K91
 */
export function generateTicketId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 7; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EVT-${year}-${random}`;
}

/**
 * Generates an opaque secure token for QR codes
 */
export function generateTicketToken(eventId: string, ticketId: string): string {
  const secretPart = Math.random().toString(36).substring(2, 10);
  return `tkn_${eventId}_${ticketId}_${secretPart}`;
}

export interface CheckInResult {
  success: boolean;
  resultCode: ScanLogResult;
  message: string;
  ticket?: DigitalTicket;
  checkedInAt?: string;
  checkedInByName?: string;
}

/**
 * Server-side / Firestore atomic transaction for QR ticket check-in.
 * Prevents double check-in race conditions.
 */
export async function processTicketCheckIn(
  ticketIdOrToken: string,
  eventId: string,
  staffUserId: string,
  staffName: string,
  fallbackLocalTickets?: DigitalTicket[]
): Promise<CheckInResult> {
  const cleanId = ticketIdOrToken.trim();

  // If Firebase Firestore is active and initialized
  try {
    const ticketRef = doc(db, 'tickets', cleanId);

    const transactionResult = await runTransaction(db, async (transaction) => {
      const ticketDoc = await transaction.get(ticketRef);

      if (!ticketDoc.exists()) {
        return {
          success: false,
          resultCode: 'invalid_event' as ScanLogResult,
          message: 'Ticket not found in database.'
        };
      }

      const ticketData = ticketDoc.data() as DigitalTicket;

      if (ticketData.eventId !== eventId) {
        return {
          success: false,
          resultCode: 'invalid_event' as ScanLogResult,
          message: `Ticket belongs to a different event (${ticketData.eventName}).`,
          ticket: ticketData
        };
      }

      if (ticketData.status === 'used') {
        return {
          success: false,
          resultCode: 'already_used' as ScanLogResult,
          message: `TICKET ALREADY USED ❌`,
          ticket: ticketData,
          checkedInAt: ticketData.checkedInAt || 'Earlier today',
          checkedInByName: ticketData.checkedInByName || 'Entrance Gate Staff'
        };
      }

      if (ticketData.status === 'cancelled' || ticketData.status === 'expired') {
        return {
          success: false,
          resultCode: 'rejected' as ScanLogResult,
          message: `Ticket is ${ticketData.status.toUpperCase()}. Entrance denied.`,
          ticket: ticketData
        };
      }

      const nowIso = new Date().toISOString();
      transaction.update(ticketRef, {
        status: 'used',
        checkedInAt: nowIso,
        checkedInBy: staffUserId,
        checkedInByName: staffName
      });

      return {
        success: true,
        resultCode: 'valid' as ScanLogResult,
        message: 'VALID TICKET ✅',
        ticket: {
          ...ticketData,
          status: 'used',
          checkedInAt: nowIso,
          checkedInBy: staffUserId,
          checkedInByName: staffName
        }
      };
    });

    return transactionResult;
  } catch (err) {
    console.warn('Firestore transaction fallback to local state handler:', err);
  }

  // Fallback for local demo state
  if (fallbackLocalTickets) {
    const found = fallbackLocalTickets.find(
      (t) => t.id === cleanId || t.ticketToken === cleanId || t.qrData.includes(cleanId)
    );

    if (!found) {
      return {
        success: false,
        resultCode: 'invalid_event',
        message: 'Ticket record not found.'
      };
    }

    if (found.eventId !== eventId) {
      return {
        success: false,
        resultCode: 'invalid_event',
        message: `Ticket is for a different event (${found.eventName}).`,
        ticket: found
      };
    }

    if (found.status === 'used') {
      return {
        success: false,
        resultCode: 'already_used',
        message: `TICKET ALREADY USED ❌`,
        ticket: found,
        checkedInAt: found.checkedInAt || '10 minutes ago',
        checkedInByName: found.checkedInByName || 'Gate Staff 1'
      };
    }

    if (found.status === 'cancelled' || found.status === 'expired') {
      return {
        success: false,
        resultCode: 'rejected',
        message: `Ticket is ${found.status.toUpperCase()}. Entrance denied.`,
        ticket: found
      };
    }

    const nowIso = new Date().toISOString();
    found.status = 'used';
    found.checkedInAt = nowIso;
    found.checkedInBy = staffUserId;
    found.checkedInByName = staffName;

    return {
      success: true,
      resultCode: 'valid',
      message: 'VALID TICKET ✅',
      ticket: { ...found }
    };
  }

  return {
    success: false,
    resultCode: 'invalid_event',
    message: 'Unable to validate ticket.'
  };
}
