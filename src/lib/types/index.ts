import { Timestamp } from "firebase-admin/firestore";

export interface Event {
  id: string;
  adminId: string;
  name: string;
  description?: string;
  ticketPrice: number;
  totalTickets: number;
  qrCodeUrl: string;
  qrCodeStoragePath: string;
  publicEventUrl: string;
  status: "active" | "closed" | "completed";
  isWinnerGenerated: boolean;
  availableTickets: number;
  reservedTickets: number;
  soldTickets: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt?: Timestamp;
  winnersGeneratedAt?: Timestamp;
}

export interface Ticket {
  id: string;
  eventId: string;
  ticketNumber: number;
  status: "available" | "reserved" | "sold";
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  reservedAt?: Timestamp;
  reservationExpiresAt?: Timestamp;
  paymentId?: string;
  isWinner: boolean;
  winPosition?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  soldAt?: Timestamp;
}

export interface Payment {
  id: string;
  eventId: string;
  ticketId: string;
  chapaReference: string;
  chapaCheckoutUrl: string;
  chapaTransactionId?: string;
  amount: number;
  currency: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  status: "pending" | "completed" | "failed" | "expired";
  webhookReceived: boolean;
  webhookData?: any;
  verifiedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  completedAt?: Timestamp;
}

export interface Winner {
  id: string;
  eventId: string;
  ticketId: string;
  position: number;
  prize?: string;
  ticketNumber: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  notified: boolean;
  notifiedAt?: Timestamp;
  claimStatus: "pending" | "claimed" | "unclaimed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
