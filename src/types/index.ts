export type UserRole = 'OWNER' | 'MANAGER' | 'CUSTOMER';

export interface User {
  id?: number;
  username: string;
  email?: string;
  password?: string;
  role: UserRole;
  marketing?: 'Interested' | 'Not Interested' | string;
  token?: string | null;
  tokenCreatedAt?: string | null;
}

export interface Customer {
  id?: number;
  name: string;
  email: string;
  bookingDate: string;
  marketing: 'Interested' | 'Not Interested' | string;
  cars?: Array<{ company?: string; model?: string; [key: string]: any }>;
}

export interface Car {
  id?: number;
  carCompany: string;
  carModel: string;
}

export interface CarCustomerAssignment {
  id: number;
  customerId?: number;
  customerName: string;
  customerEmail?: string;
  carId?: number;
  carCompany: string;
  carModel: string;
  bookingDate: string;
  marketing?: string;
}

export interface PageableResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface CustomerCarJoinResult {
  customerName?: string;
  customerId?: number;
  email?: string;
  bookingDate?: string;
  carModel?: string;
  carCompany?: string;
  carCount?: number;
  [key: string]: any;
}

export interface DashboardData {
  totalCustomers: number;
  totalCars: number;
  totalUsers: number;
  rawText?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
}
