import api from "./api";
import type {
  User,
  Listing,
  Make,
  Model,
  Trim,
  Showroom,
  Transaction,
  PaginatedResponse,
  AnalyticsOverview,
  AdminListing,
  AdminListingDetail,
  AdminShowroom,
  AdminTransaction,
  AdminSubscription,
  UserDetail,
} from "@/types";

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>("/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
};

// Admin Analytics
export const analyticsApi = {
  overview: () => api.get<AnalyticsOverview>("/admin/analytics/overview").then((r) => r.data),
};

// Admin Users
export const usersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<User>>("/admin/users", { params }).then((r) => r.data),
  get: (id: string) => api.get<UserDetail>(`/admin/users/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<Pick<User, "isActive" | "isVerified" | "role">>) =>
    api.patch<User>(`/admin/users/${id}`, data).then((r) => r.data),
  setPassword: (id: string, newPassword: string) =>
    api.post<void>(`/admin/users/${id}/password`, { newPassword }).then(() => undefined),
};

// Admin Listings
export const listingsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<AdminListing>>("/admin/listings", { params }).then((r) => r.data),
  get: (id: string) => api.get<AdminListingDetail>(`/admin/listings/${id}`).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch<Listing>(`/admin/listings/${id}/status`, { status }).then((r) => r.data),
  toggleFeatured: (id: string, isFeatured: boolean, days?: number) =>
    api.patch<Listing>(`/admin/listings/${id}/featured`, { isFeatured, days }).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/listings/${id}`),
};

// Catalog
export const catalogApi = {
  getMakes: () => api.get<Make[]>("/catalog/makes").then((r) => r.data),
  createMake: (data: Partial<Omit<Make, "id">>) => api.post<Make>("/admin/catalog/makes", data).then((r) => r.data),
  updateMake: (id: string, data: Partial<Make>) => api.patch<Make>(`/admin/catalog/makes/${id}`, data).then((r) => r.data),
  deleteMake: (id: string) => api.delete(`/admin/catalog/makes/${id}`),
  getModels: (makeId: string) => api.get<Model[]>(`/catalog/makes/${makeId}/models`).then((r) => r.data),
  createModel: (data: Partial<Omit<Model, "id">>) => api.post<Model>("/admin/catalog/models", data).then((r) => r.data),
  updateModel: (id: string, data: Partial<Model>) => api.patch<Model>(`/admin/catalog/models/${id}`, data).then((r) => r.data),
  deleteModel: (id: string) => api.delete(`/admin/catalog/models/${id}`),
  getTrims: (modelId: string) => api.get<Trim[]>(`/catalog/models/${modelId}/trims`).then((r) => r.data),
  createTrim: (data: Partial<Omit<Trim, "id">>) => api.post<Trim>("/admin/catalog/trims", data).then((r) => r.data),
  updateTrim: (id: string, data: Partial<Trim>) => api.patch<Trim>(`/admin/catalog/trims/${id}`, data).then((r) => r.data),
  deleteTrim: (id: string) => api.delete(`/admin/catalog/trims/${id}`),
};

// Upload helpers
export const uploadApi = {
  // Logo upload — preserves PNG/WebP alpha, no thumbnail. For brand/showroom marks.
  uploadLogo: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("logo", file);
    // Drop the default JSON Content-Type so axios writes the multipart boundary itself.
    const res = await api.post<{ url: string }>("/upload/logo", formData, {
      headers: { "Content-Type": undefined as unknown as string },
    });
    if (!res.data?.url) throw new Error("Upload returned no URL");
    return res.data;
  },
};

// Showrooms
export const showroomsApi = {
  list: () => api.get<AdminShowroom[]>("/admin/showrooms").then((r) => r.data),
  update: (id: string, data: Partial<Pick<Showroom, "isVerified">>) =>
    api.patch<Showroom>(`/admin/showrooms/${id}`, data).then((r) => r.data),
};

// Notifications
export const notificationsApi = {
  broadcast: (data: { title: string; body: string; targetSegment: string }) =>
    api.post<{ sent: number }>("/admin/notifications/broadcast", data).then((r) => r.data),
};

// Transactions
export const transactionsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<AdminTransaction>>("/admin/transactions", { params }).then((r) => r.data),
};

// Subscriptions
export const subscriptionsApi = {
  list: (params?: Record<string, string | number>) =>
    api
      .get<PaginatedResponse<AdminSubscription>>("/admin/subscriptions", { params })
      .then((r) => r.data),
};

// Inspections
export interface AdminInspection {
  id: string;
  userId: string;
  listingId: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  notes: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  createdAt: string;
  userName: string | null;
  userPhone: string | null;
  userEmail: string | null;
  makeNameAr: string | null;
  makeNameEn: string | null;
  modelNameAr: string | null;
  modelNameEn: string | null;
  listingYear: number | null;
  listingPrice: string | null;
}

export const inspectionsApi = {
  list: (params?: Record<string, string | number>) =>
    api
      .get<PaginatedResponse<AdminInspection>>("/admin/inspections", { params })
      .then((r) => r.data),
  updateStatus: (id: string, status: AdminInspection["status"]) =>
    api
      .patch<AdminInspection>(`/admin/inspections/${id}/status`, { status })
      .then((r) => r.data),
};
