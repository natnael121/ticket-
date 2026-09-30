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
  bankName?: string;
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
  telebirrNumber?: string;
  telebirrAccountName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
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

export interface EventCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: 'all', name: 'All Events', icon: '✨', color: '#64b5ef', bg: 'rgba(36,129,204,0.15)' },
  { id: 'music', name: 'Music & Concerts', icon: '🎵', color: '#ab47bc', bg: 'rgba(171,71,188,0.15)' },
  { id: 'tech', name: 'Tech & Innovation', icon: '💻', color: '#26c6da', bg: 'rgba(38,198,218,0.15)' },
  { id: 'party', name: 'Nightlife & Parties', icon: '🎉', color: '#ec407a', bg: 'rgba(236,64,122,0.15)' },
  { id: 'business', name: 'Business & Networking', icon: '💼', color: '#ffa726', bg: 'rgba(255,167,38,0.15)' },
  { id: 'sports', name: 'Sports & Fitness', icon: '⚽', color: '#66bb6a', bg: 'rgba(102,187,106,0.15)' },
  { id: 'arts', name: 'Arts & Culture', icon: '🎨', color: '#ff7043', bg: 'rgba(255,112,67,0.15)' },
  { id: 'general', name: 'General & Others', icon: '🌟', color: '#78909c', bg: 'rgba(120,144,156,0.15)' },
];

export interface EventItem {
  id: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  description: string;
  category?: string;
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
  customerTelegramId?: number | string; // Telegram numeric user ID for bot notifications
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
