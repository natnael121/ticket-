export type UserRole = 'super_admin' | 'organizer' | 'staff' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  telegramUserId?: string;
  telegramUsername?: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
}

export interface SuperAdminUser {
  id: string; // telegramUserId or unique id
  telegramUserId: string;
  name?: string;
  username?: string;
  addedBy?: string;
  addedAt: string;
}

export type OrganizationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface PaymentMethodConfig {
  id: string;
  type: 'Telebirr' | 'CBE Birr' | 'Bank Transfer' | 'Other';
  accountName: string;
  accountNumber: string;
  qrCodeUrl?: string;
  instructions?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  businessAddress: string;
  city: string;
  country: string;
  website?: string;
  description?: string;
  ownerUserId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  telegramUserId?: string;
  telegramUsername?: string;
  status: OrganizationStatus;
  rejectionReason?: string;
  paymentMethods: PaymentMethodConfig[];
  expectedEvents?: string;
  expectedAttendees?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type EventStatus = 'draft' | 'published' | 'closed' | 'completed' | 'cancelled';

export interface EventItem {
  id: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  description: string;
  bannerUrl: string;
  logoUrl?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  googleMapsUrl?: string;
  contactPhone: string;
  status: EventStatus;
  ticketsSold: number;
  totalQuantity: number;
  revenue: number;
  createdAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  organizationId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  totalQuantity: number;
  remainingQuantity: number;
  maxPerCustomer: number;
  saleStart?: string;
  saleEnd?: string;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'approved' | 'rejected' | 'cancelled';

export interface TicketOrder {
  id: string;
  organizationId: string;
  eventId: string;
  eventName?: string;
  ticketTypeId: string;
  ticketTypeName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  telegramUserId?: string;
  telegramUsername?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  paymentId?: string;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentSubmission {
  id: string;
  orderId: string;
  organizationId: string;
  eventId: string;
  eventName: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: string;
  screenshotUrl: string;
  status: PaymentStatus;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'expired';

export interface DigitalTicket {
  id: string; // e.g. EVT-2026-8F72K91
  ticketToken: string;
  organizationId: string;
  organizationName?: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  orderId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  price: number;
  status: TicketStatus;
  qrData: string;
  issuedAt: string;
  checkedInAt?: string;
  checkedInBy?: string;
  checkedInByName?: string;
}

export type StaffRole = 'scanner' | 'payment_manager' | 'event_manager';

export interface StaffMember {
  id: string;
  organizationId: string;
  eventId?: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  role: StaffRole;
  createdAt: string;
}

export type ScanLogResult = 'valid' | 'already_used' | 'invalid_event' | 'rejected';

export interface ScanLog {
  id: string;
  ticketId: string;
  ticketToken: string;
  eventId: string;
  organizationId: string;
  scannedByUserId: string;
  scannedByName: string;
  result: ScanLogResult;
  timestamp: string;
  customerName?: string;
  ticketTypeName?: string;
}

export interface PlatformStats {
  totalOrganizations: number;
  pendingOrganizations: number;
  activeEvents: number;
  totalTicketsIssued: number;
  totalTicketsCheckedIn: number;
  totalRevenue: number;
  pendingPaymentsCount: number;
}
