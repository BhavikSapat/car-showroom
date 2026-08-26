import axios from "axios";

// Get base API URL from env variables with production fallback
const metaEnv = (import.meta as any).env || {};
export const BASE_API_URL =
  metaEnv.VITE_API_URL ||
  metaEnv.NEXT_PUBLIC_API ||
  "https://carshowroom-production-3bd7.up.railway.app";

// Create configured Axios instance
export const apiClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Backend expects 'Bearer <token>' header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Log request error
    console.log("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors and log backend responses
apiClient.interceptors.response.use(
  (response) => {
    // Check if backend returned a string warning
    if (typeof response.data === "string") {
      const lower = response.data.toLowerCase();
      if (
        lower.includes("token expired") ||
        lower.includes("please login again") ||
        lower.includes("invalid token")
      ) {
        console.log("Backend message warning:", response.data);
        window.dispatchEvent(
          new CustomEvent("auth:token_expired", { detail: response.data }),
        );
      }
    }
    return response;
  },
  (error) => {
    // Log backend API errors directly to console for development debugging
    console.log(
      "Backend API error details:",
      error.response?.status,
      error.response?.data || error.message,
    );

    if (error.response?.status === 401 || error.response?.status === 403) {
      window.dispatchEvent(
        new CustomEvent("auth:unauthorized", { detail: error.response }),
      );
    }
    return Promise.reject(error);
  },
);
