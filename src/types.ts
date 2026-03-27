export interface Prescription {
  od: EyeData;
  os: EyeData;
  pd?: string;
  date: string;
  doctorName?: string;
  notes?: string;
}

export interface EyeData {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  customerId?: string;
  customerName?: string;
  prescription?: Prescription;
  frameSelection?: string;
  lensType?: string;
  manualFrameCost?: number;
  manualLensCost?: number;
  createdAt: number;
  userId: string;
  status: 'pending' | 'paid' | 'confirmed' | 'ready_for_pickup';
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalSpent: number;
  lastVisit: number;
  createdAt: number;
  membershipType?: 'standard' | 'premium';
  latestPrescription?: Prescription;
  latestRightEyeNumber?: string;
  latestLeftEyeNumber?: string;
  latestFrameName?: string;
  latestFrameCost?: number;
  latestLensName?: string;
  latestLensCost?: number;
  latestOrderTotal?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'staff';
  photoURL?: string;
  phone?: string;
}
