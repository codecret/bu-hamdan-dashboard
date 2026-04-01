import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  console.warn("NEXT_PUBLIC_API_URL is not set, defaulting to http://localhost:3000/api");
}

const api = axios.create({
  baseURL: API_URL || "http://localhost:3000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bh_admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === "undefined") return Promise.reject(error);

    if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
    } else if (error.response?.status === 401) {
      localStorage.removeItem("bh_admin_token");
      localStorage.removeItem("bh_admin_user");
      window.location.href = "/auth/login";
    } else if (!error.response) {
      console.error("Network error - server may be unreachable");
    }

    return Promise.reject(error);
  }
);

export default api;
