export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: "regular" | "showroom" | "dealer";
  role: "user" | "admin" | "superadmin";
  avatarUrl: string | null;
  showPhone: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  userId: string;
  category: "new" | "used";
  status: "active" | "pending" | "sold" | "expired" | "rejected";
  makeId: string;
  modelId: string;
  year: number;
  price: string;
  color: string;
  bodyType: string | null;
  fuelType: string;
  transmission: string;
  condition: string;
  mileage: number | null;
  viewsCount: number;
  favoritesCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Make {
  id: string;
  name: string;
  nameEn: string;
  logoUrl: string | null;
  isPopular: boolean;
  sortOrder: number;
}

export interface Model {
  id: string;
  makeId: string;
  name: string;
  nameEn: string;
}

export interface Showroom {
  id: string;
  userId: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  phone: string;
  address: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnalyticsOverview {
  totalUsers: number;
  newUsersThisMonth: number;
  listings: Record<string, number>;
  totalShowrooms: number;
  totalConversations: number;
  totalRevenue: number;
}
