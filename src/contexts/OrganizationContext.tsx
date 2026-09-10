import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization, EventItem, TicketOrder, PaymentSubmission, DigitalTicket } from '../types';
import { mockDataService } from '../services/mockDataService';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  orgEvents: EventItem[];
  pendingPayments: PaymentSubmission[];
  approvedPayments: PaymentSubmission[];
  allOrders: TicketOrder[];
  allTickets: DigitalTicket[];
  refreshOrgData: () => void;
  approvePayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string, reason: string) => void;
  createNewEvent: (event: Omit<EventItem, 'id' | 'createdAt' | 'ticketsSold' | 'revenue'>) => EventItem;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organizationId } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [orgEvents, setOrgEvents] = useState<EventItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentSubmission[]>([]);
  const [approvedPayments, setApprovedPayments] = useState<PaymentSubmission[]>([]);
  const [allOrders, setAllOrders] = useState<TicketOrder[]>([]);
  const [allTickets, setAllTickets] = useState<DigitalTicket[]>([]);

  const refreshOrgData = () => {
    if (!organizationId) {
      setCurrentOrganization(null);
      setOrgEvents([]);
      setPendingPayments([]);
      setApprovedPayments([]);
      setAllOrders([]);
      setAllTickets([]);
      return;
    }

    const org = mockDataService.getOrganization(organizationId);
    setCurrentOrganization(org || null);

    const events = mockDataService.getEvents(organizationId);
    setOrgEvents(events);

    const state = mockDataService.getState();
    const payments = state.payments.filter((p) => p.organizationId === organizationId);
    setPendingPayments(payments.filter((p) => p.status === 'pending'));
    setApprovedPayments(payments.filter((p) => p.status === 'approved'));

    setAllOrders(state.orders.filter((o) => o.organizationId === organizationId));
    setAllTickets(state.tickets.filter((t) => t.organizationId === organizationId));
  };

  useEffect(() => {
    refreshOrgData();
  }, [organizationId]);

  const approvePayment = (paymentId: string) => {
    mockDataService.approvePayment(paymentId);
    refreshOrgData();
  };

  const rejectPayment = (paymentId: string, reason: string) => {
    mockDataService.rejectPayment(paymentId, reason);
    refreshOrgData();
  };

  const createNewEvent = (event: Omit<EventItem, 'id' | 'createdAt' | 'ticketsSold' | 'revenue'>) => {
    const created = mockDataService.addEvent(event);
    refreshOrgData();
    return created;
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        orgEvents,
        pendingPayments,
        approvedPayments,
        allOrders,
        allTickets,
        refreshOrgData,
        approvePayment,
        rejectPayment,
        createNewEvent
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
