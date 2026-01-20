export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string; // Made optional to match usage
  date: string; // ISO String for better sorting
  time: string; // HH:mm
  guests: number;
  status: BookingStatus;
  tableId?: string; // Assigned by admin
  createdAt: number;
  remarks?: string; // Admin notes
}

export interface MenuItem {
  id: number;
  title: string;
  description: string;
  image: string;
}

export interface TimeSlot {
  time: string;
  availableSeats: number;
  isClosed: boolean; // For Fridays
}

export enum BookingStep {
  DATE_SELECT,
  TIME_SELECT,
  DETAILS,
  CONFIRMATION
}

export interface QueueState {
  isInQueue: boolean;
  position: number;
  estimatedWaitMinutes: number;
  totalTraffic: number;
}

export interface QueueTicket {
  id: string;
  startTime: number;      // Timestamp when they joined
  startPosition: number;  // Where they started
  totalTraffic: number;   // Total users when they joined
  processingRate: number; // Users processed per second
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isTyping?: boolean;
}

export interface PageDetails {
  title: string;
  location: string;
  hostName: string;
  hostStats: string;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  price: number;
  facility1Title: string;
  facility1Text: string;
  facility2Title: string;
  facility2Text: string;
}

export interface SMTPConfig {
  host: string;
  port: string;
  user: string; // Email address
  pass: string;
  fromName: string;
  isEnabled: boolean;
}