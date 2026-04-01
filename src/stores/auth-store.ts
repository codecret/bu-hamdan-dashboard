import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  accountType: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    localStorage.setItem("bh_admin_token", token);
    localStorage.setItem("bh_admin_user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("bh_admin_token");
    localStorage.removeItem("bh_admin_user");
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem("bh_admin_token");
    const raw = localStorage.getItem("bh_admin_user");
    if (token && raw) {
      try {
        const user = JSON.parse(raw);
        set({ user, token, isAuthenticated: true });
      } catch {
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));
