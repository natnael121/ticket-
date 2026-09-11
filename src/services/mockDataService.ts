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
import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'tik_app_state_clean_v3';

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

export const initialMockState: AppState = {
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

class MockDataService {
  private state: AppState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = this.loadState();
    this.initFirestoreSync();
  }

  private loadState(): AppState {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...initialMockState,
          ...parsed,
          superAdmins: parsed.superAdmins || []
        };
      }
    } catch (e) {
      console.warn('Could not load local state:', e);
    }
    return { ...initialMockState };
  }

  private saveState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save app state:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in listener notification:', err);
      }
    }
  }

  private mergeById<T extends { id: string }>(currentList: T[], incomingList: T[]): T[] {
    const map = new Map<string, T>();
    for (const item of currentList) {
      if (item && item.id) map.set(item.id, item);
    }
    for (const item of incomingList) {
      if (item && item.id) map.set(item.id, item);
    }
    return Array.from(map.values());
  }

  private mergeUsers(currentList: UserProfile[], incomingList: UserProfile[]): UserProfile[] {
    const map = new Map<string, UserProfile>();
    for (const item of currentList) {
      if (item && item.uid) map.set(item.uid, item);
    }
    for (const item of incomingList) {
      if (item && item.uid) map.set(item.uid, item);
    }
    return Array.from(map.values());
  }

  private initFirestoreSync() {
    if (!isFirebaseConfigured || typeof window === 'undefined') {
      console.log('Firebase credentials not active; using local storage fallback.');
      return;
    }

    try {
      // Organizations sync
      onSnapshot(collection(db, 'organizations'), (snapshot) => {
        const items: Organization[] = [];
        snapshot.forEach((d) => items.push(d.data() as Organization));
        if (items.length > 0) {
          this.state.organizations = this.mergeById(this.state.organizations, items);
          this.saveState();
          this.notify();
        }
      }, (err) => console.warn('Firestore organizations listener notice:', err.message));

      // Events sync
      onSnapshot(collection(db, 'events'), (snapshot) => {
        const items: EventItem[] = [];
        snapshot.forEach((d) => items.push(d.data() as EventItem));
        if (items.length > 0) {
          this.state.events = this.mergeById(this.state.events, items);
          this.saveState();
          this.notify();
        }
      }, (err) => console.warn('Firestore events listener notice:', err.message));

      // TicketTypes sync
      onSnapshot(collection(db, 'ticketTypes'), (snapshot) => {
        const items: TicketType[] = [];
        snapshot.forEach((d) => items.push(d.data() as TicketType));
        if (items.length > 0) {
          this.state.ticketTypes = this.mergeById(this.state.ticketTypes, items);
          this.saveState();
          this.notify();
        }
      }, (err) => console.warn('Firestore ticketTypes listener notice:', err.message));

      // Orders sync
      onSnapshot(collection(db, 'orders'), (snapshot) => {
        const items: TicketOrder[] = [];
        snapshot.forEach((d) => items.push(d.data() as TicketOrder));
        if (items.length > 0) {
          this.state.orders = this.mergeById(this.state.orders, items);
          this.saveState();
          this.notify();
        }
      }, (err) => console.warn('Firestore orders listener notice:', err.message));

      // Payments sync
      onSnapshot(collection(db, 'payments'), (snapshot) => {
        const items: PaymentSubmission[] = [];
        snapshot.forEach((d) => items.push(d.data() as PaymentSubmission));
        if (items.length > 0) {
          this.state.payments = this.mergeById(this.state.payments, items);
          this.saveState();
          this.notify();
        }
      }, (err) => console.warn('Firestore payments listener notice:', err.message));

      // Tickets sync
      onSnapshot(collection(db, 'tickets'), (snapshot) => {
        const items: DigitalTicket[] = [];
        snapshot.forEach((d) => items.push(d.data() as DigitalTicket));
        if (items.length > 0) {
          this.state.tickets = this.mergeById(this.state.tickets, items);
          this.saveState();
          this.notify();
        }
      }, (err) => console.warn('Firestore tickets listener notice:', err.message));

      // Super Admins sync
      onSnapshot(collection(db, 'super_admins'), (snapshot) => {
        const items: SuperAdminUser[] = [];
        snapshot.forEach((d) => items.push(d.data() as SuperAdminUser));
        this.state.superAdmins = items;
        this.saveState();
        this.notify();
      }, (err) => console.warn('Firestore super_admins listener notice:', err.message));

      // Users sync
      onSnapshot(collection(db, 'users'), (snapshot) => {
        const items: UserProfile[] = [];
        snapshot.forEach((d) => items.push(d.data() as UserProfile));
        if (items.length > 0) {
          this.state.users = this.mergeUsers(this.state.users, items);
          this.saveState();
          this.notify();
        }
      }, (err) => console.warn('Firestore users listener notice:', err.message));
    } catch (err) {
      console.warn('Firestore sync setup exception:', err);
    }
  }

  public resetState() {
    this.state = { ...initialMockState };
    this.saveState();
    this.notify();
  }

  public getState(): AppState {
    return this.state;
  }

  // ── Super Admin Authorization ───────────────────────────────────────────
  public isSuperAdmin(telegramUserId?: string | number, telegramUsername?: string): boolean {
    const envSuperAdmin = (import.meta.env.VITE_SUPER_ADMIN_TELEGRAM_ID || '').trim().replace(/^@/, '');

    const uidStr = telegramUserId ? String(telegramUserId).trim() : '';
    const usernameStr = telegramUsername ? telegramUsername.trim().replace(/^@/, '').toLowerCase() : '';

    // Check .env
    if (envSuperAdmin) {
      if (uidStr && uidStr === envSuperAdmin) return true;
      if (usernameStr && usernameStr === envSuperAdmin.toLowerCase()) return true;
    }

    // Check added super admins
    const admins = this.state.superAdmins || [];
    for (const admin of admins) {
      const adminTgId = String(admin.telegramUserId || admin.id || '').trim();
      const adminUname = admin.username ? admin.username.trim().replace(/^@/, '').toLowerCase() : '';
      if (uidStr && adminTgId && uidStr === adminTgId) return true;
      if (usernameStr && adminUname && usernameStr === adminUname) return true;
    }

    return false;
  }

  public getPrimarySuperAdminEnv(): string {
    return (import.meta.env.VITE_SUPER_ADMIN_TELEGRAM_ID || '').trim();
  }

  public getSuperAdmins(): SuperAdminUser[] {
    return this.state.superAdmins || [];
  }

  public addSuperAdmin(admin: { telegramUserId: string; name?: string; username?: string; addedBy?: string }): SuperAdminUser {
    const cleanId = String(admin.telegramUserId).trim().replace(/^@/, '');
    const newAdmin: SuperAdminUser = {
      id: cleanId,
      telegramUserId: cleanId,
      name: admin.name?.trim() || cleanId,
      username: admin.username ? admin.username.trim().replace(/^@/, '') : undefined,
      addedBy: admin.addedBy || 'Primary Super Admin',
      addedAt: new Date().toISOString()
    };

    if (!this.state.superAdmins) {
      this.state.superAdmins = [];
    }

    const existingIdx = this.state.superAdmins.findIndex((a) => a.telegramUserId === cleanId);
    if (existingIdx >= 0) {
      this.state.superAdmins[existingIdx] = newAdmin;
    } else {
      this.state.superAdmins.push(newAdmin);
    }

    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'super_admins', cleanId), newAdmin).catch((err) => {
        console.error('Failed to save super_admin to Firebase:', err);
      });
    }

    return newAdmin;
  }

  public removeSuperAdmin(telegramUserId: string): boolean {
    const cleanId = String(telegramUserId).trim().replace(/^@/, '');
    if (!this.state.superAdmins) return false;

    this.state.superAdmins = this.state.superAdmins.filter((a) => a.telegramUserId !== cleanId);
    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      deleteDoc(doc(db, 'super_admins', cleanId)).catch((err) => {
        console.error('Failed to delete super_admin from Firebase:', err);
      });
    }

    return true;
  }

  // ── Users ───────────────────────────────────────────────────────────────
  public getUserProfile(uid: string): UserProfile | undefined {
    return this.state.users.find((u) => u.uid === uid || u.telegramUserId === uid);
  }

  public upsertUserProfile(user: UserProfile): UserProfile {
    const existingIndex = this.state.users.findIndex(
      (u) => u.uid === user.uid || (user.telegramUserId && u.telegramUserId === user.telegramUserId)
    );
    if (existingIndex >= 0) {
      this.state.users[existingIndex] = { ...this.state.users[existingIndex], ...user };
    } else {
      this.state.users.push(user);
    }
    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'users', user.uid), user, { merge: true }).catch((err) => {
        console.error('Failed to save user to Firebase:', err);
      });
    }

    return user;
  }

  // ── Organizations ───────────────────────────────────────────────────────
  public getOrganizations(): Organization[] {
    return this.state.organizations;
  }

  public getOrganization(id: string): Organization | undefined {
    return this.state.organizations.find((o) => o.id === id);
  }

  public addOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'status' | 'paymentMethods'>): Organization {
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
    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'organizations', newOrg.id), newOrg).catch((err) => {
        console.error('Failed to save organization to Firebase:', err);
      });
    }

    return newOrg;
  }

  public updateOrganizationStatus(
    orgId: string,
    status: 'approved' | 'rejected' | 'suspended',
    reason?: string
  ): Organization | undefined {
    const org = this.state.organizations.find((o) => o.id === orgId);
    if (org) {
      org.status = status;
      if (reason) org.rejectionReason = reason;
      if (status === 'approved') {
        org.approvedAt = new Date().toISOString();
        org.approvedBy = 'Super Admin';
      }
      this.saveState();
      this.notify();

      if (isFirebaseConfigured) {
        updateDoc(doc(db, 'organizations', orgId), {
          status,
          ...(reason ? { rejectionReason: reason } : {}),
          ...(status === 'approved' ? { approvedAt: org.approvedAt, approvedBy: org.approvedBy } : {})
        }).catch((err) => {
          console.error('Failed to update organization status in Firebase:', err);
        });
      }
    }
    return org;
  }

  // ── Events ──────────────────────────────────────────────────────────────
  public getEvents(orgId?: string): EventItem[] {
    if (orgId) {
      return this.state.events.filter((e) => e.organizationId === orgId);
    }
    return this.state.events;
  }

  public getEvent(eventId: string): EventItem | undefined {
    return this.state.events.find((e) => e.id === eventId);
  }

  public addEvent(event: Omit<EventItem, 'id' | 'createdAt' | 'ticketsSold' | 'revenue'>): EventItem {
    const newEvent: EventItem = {
      ...event,
      id: `evt_${Date.now()}`,
      ticketsSold: 0,
      revenue: 0,
      createdAt: new Date().toISOString()
    };
    this.state.events.unshift(newEvent);
    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'events', newEvent.id), newEvent).catch((err) => {
        console.error('Failed to save event to Firebase:', err);
      });
    }

    return newEvent;
  }

  // ── Ticket Types ────────────────────────────────────────────────────────
  public getTicketTypes(eventId: string): TicketType[] {
    return this.state.ticketTypes.filter((t) => t.eventId === eventId);
  }

  public addTicketType(type: Omit<TicketType, 'id'>): TicketType {
    const newType: TicketType = {
      ...type,
      id: `tt_${Date.now()}`
    };
    this.state.ticketTypes.push(newType);
    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'ticketTypes', newType.id), newType).catch((err) => {
        console.error('Failed to save ticketType to Firebase:', err);
      });
    }

    return newType;
  }

  // ── Customer Orders & Payment Submissions ───────────────────────────────
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
    const ticketType = this.state.ticketTypes.find((t) => t.id === ticketTypeId);

    if (!event || !ticketType) {
      throw new Error('Event or Ticket Type not found');
    }

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
    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'orders', newOrder.id), newOrder).catch((err) => {
        console.error('Failed to save order to Firebase:', err);
      });
      setDoc(doc(db, 'payments', newPayment.id), newPayment).catch((err) => {
        console.error('Failed to save payment to Firebase:', err);
      });
    }

    return { order: newOrder, payment: newPayment };
  }

  // ── Payment Approvals & Automatic Ticket Generation ─────────────────────
  public approvePayment(paymentId: string, reviewerName = 'Organizer Admin'): { payment: PaymentSubmission; tickets: DigitalTicket[] } {
    const payment = this.state.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found');

    const order = this.state.orders.find((o) => o.id === payment.orderId);
    if (!order) throw new Error('Order not found');

    const event = this.getEvent(order.eventId);
    const ticketType = this.state.ticketTypes.find((t) => t.id === order.ticketTypeId);

    const nowIso = new Date().toISOString();
    payment.status = 'approved';
    payment.reviewedAt = nowIso;
    payment.reviewedBy = reviewerName;

    order.status = 'approved';

    // Generate Tickets
    const generatedTickets: DigitalTicket[] = [];
    for (let i = 0; i < order.quantity; i++) {
      const year = new Date().getFullYear();
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let random = '';
      for (let k = 0; k < 7; k++) random += chars.charAt(Math.floor(Math.random() * chars.length));
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

      if (isFirebaseConfigured) {
        setDoc(doc(db, 'tickets', newTicket.id), newTicket).catch((err) => {
          console.error('Failed to save ticket to Firebase:', err);
        });
      }
    }

    if (event) {
      event.ticketsSold += order.quantity;
      event.revenue += order.totalPrice;
      if (isFirebaseConfigured) {
        updateDoc(doc(db, 'events', event.id), {
          ticketsSold: event.ticketsSold,
          revenue: event.revenue
        }).catch(console.error);
      }
    }

    if (ticketType) {
      ticketType.remainingQuantity = Math.max(0, ticketType.remainingQuantity - order.quantity);
      if (isFirebaseConfigured) {
        updateDoc(doc(db, 'ticketTypes', ticketType.id), {
          remainingQuantity: ticketType.remainingQuantity
        }).catch(console.error);
      }
    }

    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      updateDoc(doc(db, 'payments', payment.id), {
        status: 'approved',
        reviewedAt: nowIso,
        reviewedBy: reviewerName
      }).catch(console.error);
      updateDoc(doc(db, 'orders', order.id), {
        status: 'approved'
      }).catch(console.error);
    }

    return { payment, tickets: generatedTickets };
  }

  public rejectPayment(paymentId: string, reason: string, reviewerName = 'Organizer Admin'): PaymentSubmission {
    const payment = this.state.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found');

    const order = this.state.orders.find((o) => o.id === payment.orderId);

    const nowIso = new Date().toISOString();
    payment.status = 'rejected';
    payment.rejectionReason = reason;
    payment.reviewedAt = nowIso;
    payment.reviewedBy = reviewerName;

    if (order) {
      order.status = 'rejected';
    }

    this.saveState();
    this.notify();

    if (isFirebaseConfigured) {
      updateDoc(doc(db, 'payments', payment.id), {
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: nowIso,
        reviewedBy: reviewerName
      }).catch(console.error);
      if (order) {
        updateDoc(doc(db, 'orders', order.id), {
          status: 'rejected'
        }).catch(console.error);
      }
    }

    return payment;
  }

  // ── Customer Tickets Wallet ─────────────────────────────────────────────
  public getCustomerTickets(phoneOrEmailOrTgId?: string): DigitalTicket[] {
    if (!phoneOrEmailOrTgId) return this.state.tickets;
    const clean = phoneOrEmailOrTgId.trim().toLowerCase();
    return this.state.tickets.filter(
      (t) =>
        t.customerPhone.toLowerCase().includes(clean) ||
        (t.customerEmail && t.customerEmail.toLowerCase().includes(clean)) ||
        t.customerId.toLowerCase().includes(clean)
    );
  }

  // ── Platform Level Stats for Super Admin ────────────────────────────────
  public getPlatformStats(): PlatformStats {
    const totalOrganizations = this.state.organizations.length;
    const pendingOrganizations = this.state.organizations.filter((o) => o.status === 'pending').length;
    const activeEvents = this.state.events.filter((e) => e.status === 'published').length;
    const totalTicketsIssued = this.state.tickets.length;
    const totalTicketsCheckedIn = this.state.tickets.filter((t) => t.status === 'used').length;
    const totalRevenue = this.state.events.reduce((sum, e) => sum + e.revenue, 0);
    const pendingPaymentsCount = this.state.payments.filter((p) => p.status === 'pending').length;

    return {
      totalOrganizations,
      pendingOrganizations,
      activeEvents,
      totalTicketsIssued,
      totalTicketsCheckedIn,
      totalRevenue,
      pendingPaymentsCount
    };
  }
}

export const mockDataService = new MockDataService();
