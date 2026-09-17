/**
 * firestoreService.ts
 *
 * Production Firebase Firestore Data Service.
 * - Real-time onSnapshot synchronization with Cloud Firestore
 * - Immediate persistent writes to Firestore collections
 * - Local caching for instant rendering and offline resilience
 * - Handles anonymous auth & explicit permission diagnostics
 */

import {
  Organization,
  EventItem,
  TicketType,
  TicketOrder,
  PaymentSubmission,
  DigitalTicket,
  StaffMember,
  UserProfile,
  ScanLog,
  PlatformStats,
  SuperAdminUser
} from '../types';
import { db, auth, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// ─── Local cache key ────────────────────────────────────────────────────────
const LOCAL_STORAGE_KEY = 'tik_app_firestore_cache_v1';

/** Strips undefined fields recursively – Firestore rejects them */
function sanitize<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] =
      v !== null && typeof v === 'object' && !Array.isArray(v) ? sanitize(v) : v;
  }
  return out;
}

// ─── App State ──────────────────────────────────────────────────────────────
export interface AppState {
  users: UserProfile[];
  organizations: Organization[];
  events: EventItem[];
  ticketTypes: TicketType[];
  orders: TicketOrder[];
  payments: PaymentSubmission[];
  tickets: DigitalTicket[];
  staff: StaffMember[];
  scanLogs: ScanLog[];
  superAdmins: SuperAdminUser[];
}

export const initialAppState: AppState = {
  users: [],
  organizations: [],
  events: [],
  ticketTypes: [],
  orders: [],
  payments: [],
  tickets: [],
  staff: [],
  scanLogs: [],
  superAdmins: []
};

// ─── Firestore Service Class ────────────────────────────────────────────────
export class FirestoreService {
  private state: AppState;
  private listeners: Array<() => void> = [];
  public hasPermissionError = false;
  public lastErrorMessage = '';
  private authReady: Promise<void>;

  constructor() {
    this.state = this.loadCachedState();
    this.authReady = this.initAuth();
    if (isFirebaseConfigured) {
      this.initFirestoreSync();
    }
  }

  // ── Auth initialization ───────────────────────────────────────────────────

  private initAuth(): Promise<void> {
    if (!isFirebaseConfigured) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsub();
          resolve();
        } else {
          signInAnonymously(auth)
            .then(() => {
              unsub();
              resolve();
            })
            .catch((err) => {
              console.warn(
                '[FirestoreService] Anonymous auth warning:',
                err.code,
                err.message
              );
              unsub();
              resolve();
            });
        }
      });
    });
  }

  // ── Local caching ─────────────────────────────────────────────────────────

  private loadCachedState(): AppState {
    try {
      // Also check legacy key if exists
      const stored =
        localStorage.getItem(LOCAL_STORAGE_KEY) ||
        localStorage.getItem('tik_app_state_v4');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...initialAppState, ...parsed, superAdmins: parsed.superAdmins || [] };
      }
    } catch (e) {
      console.warn('[FirestoreService] Could not load cached state:', e);
    }
    return { ...initialAppState };
  }

  private saveCachedState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('[FirestoreService] Failed to cache state:', e);
    }
  }

  // ── Listeners / Reactivity ────────────────────────────────────────────────

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error('[FirestoreService] Listener error:', err);
      }
    }
  }

  // ── Merge helpers ─────────────────────────────────────────────────────────

  private mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
    const map = new Map<string, T>();
    for (const item of local) if (item?.id) map.set(item.id, item);
    for (const item of remote) if (item?.id) map.set(item.id, item);
    return Array.from(map.values());
  }

  private mergeUsers(local: UserProfile[], remote: UserProfile[]): UserProfile[] {
    const map = new Map<string, UserProfile>();
    for (const u of local) if (u?.uid) map.set(u.uid, u);
    for (const u of remote) if (u?.uid) map.set(u.uid, u);
    return Array.from(map.values());
  }

  // ── Firestore real-time collection listeners ──────────────────────────────

  private initFirestoreSync() {
    const watch = <T>(
      colName: string,
      merge: (local: T[], remote: T[]) => T[],
      assign: (items: T[]) => void
    ) => {
      onSnapshot(
        collection(db, colName),
        (snap) => {
          this.hasPermissionError = false;
          const items: T[] = [];
          snap.forEach((d) => items.push(d.data() as T));
          assign(items);
          this.saveCachedState();
          this.notify();
        },
        (err) => {
          if (err.code === 'permission-denied') {
            this.hasPermissionError = true;
            this.lastErrorMessage =
              'Firestore permission denied. Update Firestore rules in Firebase Console.';
            console.warn(
              `[FirestoreService] Permission Denied on '${colName}'. Update your Firebase Console Firestore security rules.`
            );
          } else {
            console.warn(`[FirestoreService] ${colName} listener warning:`, err.message);
          }
          this.notify();
        }
      );
    };

    watch<Organization>(
      'organizations',
      (l, r) => this.mergeById(l, r),
      (items) => {
        this.state.organizations = this.mergeById(this.state.organizations, items);
      }
    );
    watch<EventItem>(
      'events',
      (l, r) => this.mergeById(l, r),
      (items) => {
        this.state.events = this.mergeById(this.state.events, items);
      }
    );
    watch<TicketType>(
      'ticketTypes',
      (l, r) => this.mergeById(l, r),
      (items) => {
        this.state.ticketTypes = this.mergeById(this.state.ticketTypes, items);
      }
    );
    watch<TicketOrder>(
      'orders',
      (l, r) => this.mergeById(l, r),
      (items) => {
        this.state.orders = this.mergeById(this.state.orders, items);
      }
    );
    watch<PaymentSubmission>(
      'payments',
      (l, r) => this.mergeById(l, r),
      (items) => {
        this.state.payments = this.mergeById(this.state.payments, items);
      }
    );
    watch<DigitalTicket>(
      'tickets',
      (l, r) => this.mergeById(l, r),
      (items) => {
        this.state.tickets = this.mergeById(this.state.tickets, items);
      }
    );
    watch<UserProfile>(
      'users',
      (l, r) => this.mergeUsers(l, r),
      (items) => {
        this.state.users = this.mergeUsers(this.state.users, items);
      }
    );

    // super_admins
    onSnapshot(
      collection(db, 'super_admins'),
      (snap) => {
        const items: SuperAdminUser[] = [];
        snap.forEach((d) => items.push(d.data() as SuperAdminUser));
        this.state.superAdmins = items;
        this.saveCachedState();
        this.notify();
      },
      (err) => {
        if (err.code === 'permission-denied') {
          this.hasPermissionError = true;
        }
        console.warn('[FirestoreService] super_admins listener:', err.message);
      }
    );
  }

  // ── Firestore write execution ─────────────────────────────────────────────

  private async fsWrite(actionName: string, fn: () => Promise<void>) {
    if (!isFirebaseConfigured) return;
    try {
      await this.authReady;
      await fn();
      console.log(`[FirestoreService] Write succeeded: ${actionName}`);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || String(err).includes('PERMISSION_DENIED')) {
        this.hasPermissionError = true;
        this.lastErrorMessage =
          'Firebase security rules denied write permission. Please update Firestore rules in Firebase Console.';
        console.error(
          `[FirestoreService] ❌ Firestore Permission Denied on '${actionName}'.\nPlease visit Firebase Console -> Firestore -> Rules and allow access.`,
          err
        );
      } else {
        console.error(`[FirestoreService] Write error on '${actionName}':`, err?.message || err);
      }
      this.notify();
    }
  }

  // ── Public Accessors & Mutations ──────────────────────────────────────────

  public resetState() {
    this.state = { ...initialAppState };
    this.saveCachedState();
    this.notify();
  }

  public getState(): AppState {
    return this.state;
  }

  // ── Super Admin Auth ──────────────────────────────────────────────────────

  public isSuperAdmin(telegramUserId?: string | number, telegramUsername?: string): boolean {
    try {
      const envRaw = (import.meta.env.VITE_SUPER_ADMIN_TELEGRAM_ID || '').trim();
      const envId = envRaw.replace(/^@/, '').toLowerCase();

      const cleanId = telegramUserId
        ? String(telegramUserId).trim().replace(/^@/, '').toLowerCase()
        : '';
      const cleanUname = telegramUsername
        ? String(telegramUsername).trim().replace(/^@/, '').toLowerCase()
        : '';

      if (envId) {
        if (cleanId && cleanId === envId) return true;
        if (cleanUname && cleanUname === envId) return true;
      }

      for (const admin of this.state.superAdmins || []) {
        const aId = String(admin.telegramUserId || admin.id || '')
          .trim()
          .replace(/^@/, '')
          .toLowerCase();
        const aName = admin.username
          ? String(admin.username).trim().replace(/^@/, '').toLowerCase()
          : '';
        if (cleanId && aId && cleanId === aId) return true;
        if (cleanUname && aName && cleanUname === aName) return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  public getPrimarySuperAdminEnv(): string {
    return (import.meta.env.VITE_SUPER_ADMIN_TELEGRAM_ID || '').trim();
  }

  public getSuperAdmins(): SuperAdminUser[] {
    return this.state.superAdmins || [];
  }

  public addSuperAdmin(admin: {
    telegramUserId: string;
    name?: string;
    username?: string;
  }): SuperAdminUser {
    const cleanId = String(admin.telegramUserId).trim().replace(/^@/, '');
    const newAdmin: SuperAdminUser = {
      id: cleanId,
      telegramUserId: cleanId,
      name: admin.name?.trim() || cleanId,
      username: admin.username ? admin.username.trim().replace(/^@/, '') : undefined,
      addedBy: 'Primary Super Admin',
      addedAt: new Date().toISOString()
    };

    if (!this.state.superAdmins) this.state.superAdmins = [];
    const idx = this.state.superAdmins.findIndex((a) => a.telegramUserId === cleanId);
    if (idx >= 0) {
      this.state.superAdmins[idx] = newAdmin;
    } else {
      this.state.superAdmins.push(newAdmin);
    }
    this.saveCachedState();
    this.notify();

    this.fsWrite(`addSuperAdmin(${cleanId})`, () =>
      setDoc(doc(db, 'super_admins', cleanId), sanitize(newAdmin))
    );
    return newAdmin;
  }

  public removeSuperAdmin(telegramUserId: string): boolean {
    const cleanId = String(telegramUserId).trim().replace(/^@/, '');
    if (!this.state.superAdmins) return false;
    this.state.superAdmins = this.state.superAdmins.filter(
      (a) => a.telegramUserId !== cleanId
    );
    this.saveCachedState();
    this.notify();
    this.fsWrite(`removeSuperAdmin(${cleanId})`, () =>
      deleteDoc(doc(db, 'super_admins', cleanId))
    );
    return true;
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  public getUserProfile(uid: string): UserProfile | undefined {
    return this.state.users.find((u) => u.uid === uid || u.telegramUserId === uid);
  }

  public upsertUserProfile(user: UserProfile): UserProfile {
    const idx = this.state.users.findIndex(
      (u) =>
        u.uid === user.uid ||
        (user.telegramUserId && u.telegramUserId === user.telegramUserId)
    );
    if (idx >= 0) {
      this.state.users[idx] = { ...this.state.users[idx], ...user };
    } else {
      this.state.users.push(user);
    }
    this.saveCachedState();
    this.notify();
    this.fsWrite(`upsertUser(${user.uid})`, () =>
      setDoc(doc(db, 'users', user.uid), sanitize(user), { merge: true })
    );
    return user;
  }

  // ── Organizations ─────────────────────────────────────────────────────────

  public getOrganizations(): Organization[] {
    return this.state.organizations || [];
  }

  public getOrganization(id: string): Organization | undefined {
    return (this.state.organizations || []).find((o) => o.id === id);
  }

  public addOrganization(
    org: Omit<Organization, 'id' | 'createdAt' | 'status' | 'paymentMethods'>
  ): Organization {
    const newOrg: Organization = {
      ...org,
      id: `org_${Date.now()}`,
      status: 'pending',
      paymentMethods: [
        {
          id: `pm_${Date.now()}`,
          type: 'Telebirr',
          accountName: org.name,
          accountNumber: org.ownerPhone
        }
      ],
      createdAt: new Date().toISOString()
    };
    this.state.organizations.unshift(newOrg);
    this.saveCachedState();
    this.notify();
    this.fsWrite(`addOrganization(${newOrg.id})`, () =>
      setDoc(doc(db, 'organizations', newOrg.id), sanitize(newOrg))
    );
    return newOrg;
  }

  public updateOrganizationStatus(
    orgId: string,
    status: 'approved' | 'rejected' | 'suspended',
    reason?: string
  ): Organization | undefined {
    const org = (this.state.organizations || []).find((o) => o.id === orgId);
    if (org) {
      org.status = status;
      if (reason) org.rejectionReason = reason;
      if (status === 'approved') {
        org.approvedAt = new Date().toISOString();
        org.approvedBy = 'Super Admin';
      }
      this.saveCachedState();
      this.notify();

      const payload = sanitize({
        status,
        ...(reason ? { rejectionReason: reason } : {}),
        ...(status === 'approved'
          ? { approvedAt: org.approvedAt, approvedBy: org.approvedBy }
          : {})
      });
      this.fsWrite(`updateOrganizationStatus(${orgId}, ${status})`, () =>
        updateDoc(doc(db, 'organizations', orgId), payload)
      );
    }
    return org;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  public getEvents(orgId?: string): EventItem[] {
    const events = this.state.events || [];
    return orgId ? events.filter((e) => e.organizationId === orgId) : events;
  }

  public getEvent(eventId: string): EventItem | undefined {
    return (this.state.events || []).find((e) => e.id === eventId);
  }

  public addEvent(
    event: Omit<EventItem, 'id' | 'createdAt' | 'ticketsSold' | 'revenue'>
  ): EventItem {
    const newEvent: EventItem = {
      ...event,
      category: event.category || 'general',
      id: `evt_${Date.now()}`,
      ticketsSold: 0,
      revenue: 0,
      createdAt: new Date().toISOString()
    };
    this.state.events.unshift(newEvent);
    this.saveCachedState();
    this.notify();
    this.fsWrite(`addEvent(${newEvent.id})`, () =>
      setDoc(doc(db, 'events', newEvent.id), sanitize(newEvent))
    );
    return newEvent;
  }

  public updateEvent(eventId: string, updates: Partial<EventItem>): EventItem | undefined {
    const idx = (this.state.events || []).findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      this.state.events[idx] = { ...this.state.events[idx], ...updates };
      this.saveCachedState();
      this.notify();
      this.fsWrite(`updateEvent(${eventId})`, () =>
        updateDoc(doc(db, 'events', eventId), sanitize(updates))
      );
      return this.state.events[idx];
    }
    return undefined;
  }

  // ── Ticket Types ──────────────────────────────────────────────────────────

  public getTicketTypes(eventId: string): TicketType[] {
    return (this.state.ticketTypes || []).filter((t) => t.eventId === eventId);
  }

  public addTicketType(type: Omit<TicketType, 'id'>): TicketType {
    const newType: TicketType = { ...type, id: `tt_${Date.now()}` };
    this.state.ticketTypes.push(newType);
    this.saveCachedState();
    this.notify();
    this.fsWrite(`addTicketType(${newType.id})`, () =>
      setDoc(doc(db, 'ticketTypes', newType.id), sanitize(newType))
    );
    return newType;
  }

  // ── Orders & Payments ─────────────────────────────────────────────────────

  public submitOrderAndPayment(
    eventId: string,
    ticketTypeId: string,
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    quantity: number,
    paymentMethod: string,
    screenshotUrl: string
  ): { order: TicketOrder; payment: PaymentSubmission } {
    const event = this.getEvent(eventId);
    const ticketType = (this.state.ticketTypes || []).find((t) => t.id === ticketTypeId);
    if (!event || !ticketType) throw new Error('Event or Ticket Type not found');

    const orderId = `ord_${Date.now()}`;
    const paymentId = `pay_${Date.now()}`;
    const totalPrice = ticketType.price * quantity;

    const newOrder: TicketOrder = {
      id: orderId,
      organizationId: event.organizationId,
      eventId: event.id,
      eventName: event.name,
      ticketTypeId: ticketType.id,
      ticketTypeName: ticketType.name,
      customerId: `cust_${Date.now()}`,
      customerName,
      customerPhone,
      customerEmail,
      quantity,
      unitPrice: ticketType.price,
      totalPrice,
      status: 'pending_payment',
      paymentId,
      createdAt: new Date().toISOString()
    };

    const newPayment: PaymentSubmission = {
      id: paymentId,
      orderId,
      organizationId: event.organizationId,
      eventId: event.id,
      eventName: event.name,
      customerName,
      customerPhone,
      amount: totalPrice,
      paymentMethod,
      screenshotUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.state.orders.unshift(newOrder);
    this.state.payments.unshift(newPayment);
    this.saveCachedState();
    this.notify();

    this.fsWrite(`submitOrderAndPayment(${orderId})`, async () => {
      await setDoc(doc(db, 'orders', newOrder.id), sanitize(newOrder));
      await setDoc(doc(db, 'payments', newPayment.id), sanitize(newPayment));
    });

    return { order: newOrder, payment: newPayment };
  }

  // ── Approve / Reject Payments ─────────────────────────────────────────────

  public approvePayment(
    paymentId: string,
    reviewerName = 'Organizer Admin'
  ): { payment: PaymentSubmission; tickets: DigitalTicket[] } {
    const payment = (this.state.payments || []).find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found');

    const order = (this.state.orders || []).find((o) => o.id === payment.orderId);
    if (!order) throw new Error('Order not found');

    const event = this.getEvent(order.eventId);
    const ticketType = (this.state.ticketTypes || []).find(
      (t) => t.id === order.ticketTypeId
    );

    const nowIso = new Date().toISOString();
    payment.status = 'approved';
    payment.reviewedAt = nowIso;
    payment.reviewedBy = reviewerName;
    order.status = 'approved';

    const generatedTickets: DigitalTicket[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (let i = 0; i < order.quantity; i++) {
      const year = new Date().getFullYear();
      let random = '';
      for (let k = 0; k < 7; k++)
        random += chars.charAt(Math.floor(Math.random() * chars.length));
      const ticketId = `EVT-${year}-${random}`;
      const ticketToken = `tkn_${order.eventId}_${ticketId}_${Math.random().toString(36).substring(2, 6)}`;

      const newTicket: DigitalTicket = {
        id: ticketId,
        ticketToken,
        organizationId: order.organizationId,
        organizationName: event?.organizationName || 'Event Organizer',
        eventId: order.eventId,
        eventName: event?.name || order.eventName || 'Event',
        eventDate: event?.date || new Date().toISOString().split('T')[0],
        eventTime: event?.startTime || '18:00',
        venue: event?.venue || 'Event Venue',
        orderId: order.id,
        ticketTypeId: order.ticketTypeId,
        ticketTypeName: order.ticketTypeName,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        price: order.unitPrice,
        status: 'valid',
        qrData: ticketId,
        issuedAt: nowIso
      };

      this.state.tickets.unshift(newTicket);
      generatedTickets.push(newTicket);
      this.fsWrite(`ticket_issue(${newTicket.id})`, () =>
        setDoc(doc(db, 'tickets', newTicket.id), sanitize(newTicket))
      );
    }

    if (event) {
      event.ticketsSold += order.quantity;
      event.revenue += order.totalPrice;
      this.fsWrite(`event_stats_update(${event.id})`, () =>
        updateDoc(
          doc(db, 'events', event.id),
          sanitize({
            ticketsSold: event.ticketsSold,
            revenue: event.revenue
          })
        )
      );
    }

    if (ticketType) {
      ticketType.remainingQuantity = Math.max(
        0,
        ticketType.remainingQuantity - order.quantity
      );
      this.fsWrite(`ticket_type_update(${ticketType.id})`, () =>
        updateDoc(
          doc(db, 'ticketTypes', ticketType.id),
          sanitize({
            remainingQuantity: ticketType.remainingQuantity
          })
        )
      );
    }

    this.saveCachedState();
    this.notify();

    this.fsWrite(`payment_approve(${payment.id})`, async () => {
      await updateDoc(
        doc(db, 'payments', payment.id),
        sanitize({
          status: 'approved',
          reviewedAt: nowIso,
          reviewedBy: reviewerName
        })
      );
      await updateDoc(doc(db, 'orders', order.id), { status: 'approved' });
    });

    return { payment, tickets: generatedTickets };
  }

  public rejectPayment(
    paymentId: string,
    reason: string,
    reviewerName = 'Organizer Admin'
  ): PaymentSubmission {
    const payment = (this.state.payments || []).find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found');

    const order = (this.state.orders || []).find((o) => o.id === payment.orderId);
    const nowIso = new Date().toISOString();

    payment.status = 'rejected';
    payment.rejectionReason = reason;
    payment.reviewedAt = nowIso;
    payment.reviewedBy = reviewerName;
    if (order) order.status = 'rejected';

    this.saveCachedState();
    this.notify();

    this.fsWrite(`payment_reject(${payment.id})`, async () => {
      await updateDoc(
        doc(db, 'payments', payment.id),
        sanitize({
          status: 'rejected',
          rejectionReason: reason,
          reviewedAt: nowIso,
          reviewedBy: reviewerName
        })
      );
      if (order) {
        await updateDoc(doc(db, 'orders', order.id), { status: 'rejected' });
      }
    });

    return payment;
  }

  // ── Customer Tickets Wallet ───────────────────────────────────────────────

  public getCustomerTickets(phoneOrEmailOrTgId?: string): DigitalTicket[] {
    const tickets = this.state.tickets || [];
    if (!phoneOrEmailOrTgId) return tickets;
    const clean = phoneOrEmailOrTgId.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        (t.customerPhone || '').toLowerCase().includes(clean) ||
        (t.customerEmail && t.customerEmail.toLowerCase().includes(clean)) ||
        (t.customerId || '').toLowerCase().includes(clean)
    );
  }

  public getCustomerPayments(phoneOrEmailOrName?: string): PaymentSubmission[] {
    const payments = this.state.payments || [];
    if (!phoneOrEmailOrName) return payments;
    const clean = phoneOrEmailOrName.trim().toLowerCase();
    return payments.filter(
      (p) =>
        (p.customerPhone || '').toLowerCase().includes(clean) ||
        (p.customerName || '').toLowerCase().includes(clean)
    );
  }

  // ── Platform Stats ────────────────────────────────────────────────────────

  public getPlatformStats(): PlatformStats {
    const orgs = this.state.organizations || [];
    const events = this.state.events || [];
    const tickets = this.state.tickets || [];
    const payments = this.state.payments || [];

    return {
      totalOrganizations: orgs.length,
      pendingOrganizations: orgs.filter((o) => o.status === 'pending').length,
      activeEvents: events.filter((e) => e.status === 'published').length,
      totalTicketsIssued: tickets.length,
      totalTicketsCheckedIn: tickets.filter((t) => t.status === 'used').length,
      totalRevenue: events.reduce((s, e) => s + (e.revenue || 0), 0),
      pendingPaymentsCount: payments.filter((p) => p.status === 'pending').length
    };
  }
}

// Global Singleton Instance
export const firestoreService = new FirestoreService();
// Alias for backward compatibility
export const dataService = firestoreService;
