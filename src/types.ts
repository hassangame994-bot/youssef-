export type OrderStatus = 'pending' | 'preparing' | 'delivered' | 'rejected';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface MenuItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  image: string;
  category: string;
  available?: boolean;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface CartExtra {
  nameAr: string;
  nameEn: string;
  price: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  extras?: CartExtra[];
  rating?: number;
}

export interface Order {
  id: string;
  userId: string;
  username: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

