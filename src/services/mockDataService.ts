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
  PlatformStats
} from '../types';

const LOCAL_STORAGE_KEY = 'tik_app_state_clean_v2';

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
}

export const initialMockState: AppState = {
  users: [
    {
      uid: 'super_admin_001',
      email: 'admin@telegram-ticketing.app',
      fullName: 'Platform Super Admin',
      phone: '+251911000000',
      telegramUserId: '100001',
      telegramUsername: 'admin',
      role: 'super_admin',
      createdAt: new Date().toISOString()
    }
  ],
  organizations: [],
  events: [],
  ticketTypes: [],
  orders: [],
  payments: [],
  tickets: [],
  staff: [],
  scanLogs: []
};

class MockDataService {
  private state: AppState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load local state:', e);
    }
    return initialMockState;
  }

  private saveState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save app state:', e);
    }
  }

  public resetState() {
    this.state = initialMockState;
    this.saveState();
  }

  public getState(): AppState {
    return this.state;
  }

  // Users
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
    return user;
  }

  // Organizations
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
    }
    return org;
  }

  // Events
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
    return newEvent;
  }

  // Ticket Types
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
    return newType;
  }

  // Customer Orders & Payment Submissions
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

    return { order: newOrder, payment: newPayment };
  }

  // Payment Approvals & Automatic Ticket Generation
  public approvePayment(paymentId: string, reviewerName = 'Organizer Admin'): { payment: PaymentSubmission; tickets: DigitalTicket[] } {
    const payment = this.state.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found');

    const order = this.state.orders.find((o) => o.id === payment.orderId);
    if (!order) throw new Error('Order not found');

    const event = this.getEvent(order.eventId);
    const ticketType = this.state.ticketTypes.find((t) => t.id === order.ticketTypeId);

    payment.status = 'approved';
    payment.reviewedAt = new Date().toISOString();
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
        issuedAt: new Date().toISOString()
      };

      this.state.tickets.unshift(newTicket);
      generatedTickets.push(newTicket);
    }

    // Update statistics
    if (event) {
      event.ticketsSold += order.quantity;
      event.revenue += order.totalPrice;
    }
    if (ticketType) {
      ticketType.remainingQuantity = Math.max(0, ticketType.remainingQuantity - order.quantity);
    }

    this.saveState();
    return { payment, tickets: generatedTickets };
  }

  public rejectPayment(paymentId: string, reason: string, reviewerName = 'Organizer Admin'): PaymentSubmission {
    const payment = this.state.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found');

    const order = this.state.orders.find((o) => o.id === payment.orderId);

    payment.status = 'rejected';
    payment.rejectionReason = reason;
    payment.reviewedAt = new Date().toISOString();
    payment.reviewedBy = reviewerName;

    if (order) {
      order.status = 'rejected';
    }

    this.saveState();
    return payment;
  }

  // Customer Tickets Wallet
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

  // Platform Level Stats for Super Admin
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
