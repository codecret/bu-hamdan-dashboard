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

/** Admin-enriched listing with joined make/model/user data */
export interface AdminListing extends Listing {
  makeName: string | null;
  makeNameEn: string | null;
  modelName: string | null;
  modelNameEn: string | null;
  userName: string | null;
  primaryImage: string | null;
  isNegotiable: boolean;
  interiorColor: string | null;
  engineSize: string | null;
  cylinders: number | null;
  horsepower: number | null;
  description: string | null;
  location: string;
  governorate: string;
  city: string;
  featuredUntil: string | null;
}

export interface AdminListingDetail extends AdminListing {
  trimName: string | null;
  trimNameEn: string | null;
  userPhone: string | null;
  userAvatarUrl: string | null;
  images: ListingImage[];
  features: ListingFeature[];
}

export interface ListingImage {
  id: string;
  listingId: string;
  url: string;
  thumbnailUrl: string;
  order: number;
  isPrimary: boolean;
}

export interface ListingFeature {
  id: string;
  listingId: string;
  name: string;
  nameEn: string;
  category: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio: string | null;
  location: string | null;
  governorate: string | null;
  city: string | null;
  whatsappNumber: string | null;
  favoriteCar: string | null;
  favoriteMakeId: string | null;
  favoriteModelId: string | null;
  favoriteTrim: string | null;
  favoriteMake: { id: string; name: string; nameEn: string } | null;
  favoriteModel: { id: string; name: string; nameEn: string } | null;
  listingsCount: number;
  rating: string;
  reviewsCount: number;
}

export interface UserDetail extends User {
  profile: UserProfile | null;
  listings: Listing[];
}

export interface AdminShowroom extends Showroom {
  logoUrl: string | null;
  coverUrl: string | null;
  whatsappBusiness: string | null;
  website: string | null;
  workingHours: unknown;
  ownerName: string | null;
  ownerEmail: string | null;
}

export interface AdminTransaction extends Transaction {
  listingId: string | null;
  paymentRef: string | null;
  userName: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const PAGE_LIMIT = 20;

export interface AnalyticsOverview {
  totalUsers: number;
  newUsersThisMonth: number;
  listings: Record<string, number>;
  totalShowrooms: number;
  totalConversations: number;
  totalRevenue: number;
}
