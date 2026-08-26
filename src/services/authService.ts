import { apiClient } from "./api";
import { User, UserRole } from "../types";

// Storage keys for persisting user session
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const authService = {
  // Register new user: POST /register
  async register(user: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<User | string> {
    try {
      const response = await apiClient.post<User>("/register", {
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role || "MANAGER",
      });
      return response.data;
    } catch (err: any) {
      console.log("Register API Error:", err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === "string") {
        throw new Error(err.response.data.trim());
      }
      throw new Error(err.message || "Failed to register account.");
    }
  },

  // Login user: POST /login
  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; message: string; user?: User }> {
    try {
      // 1. Login
      const response = await apiClient.post("/login", {
        username,
        password,
      });

      const data = response.data;

      // =========================================================
      // CASE 1: Backend returns a STRING
      // Example:
      // "You have LoggedIn Successfully!\nToken : UUID"
      // =========================================================
      if (typeof data === "string") {
        const text = data.trim();

        if (
          text.includes("Invalid Username and Password") ||
          text.includes("Invalid")
        ) {
          throw new Error("Invalid Username and Password!");
        }

        if (text.includes("Already Logged In")) {
          throw new Error("Already Logged In, Cannot re-Login again!");
        }

        // Extract token
        const tokenPart = text.split("Token :")[1];

        if (!tokenPart) {
          throw new Error("Login successful, but token was not returned.");
        }

        const token = tokenPart.trim();

        // IMPORTANT:
        // Save token BEFORE calling /profile
        // so apiClient can send Authorization header.
        localStorage.setItem(TOKEN_KEY, token);

        // =========================================================
        // 2. Get REAL USER PROFILE from backend
        // This gives us the actual role:
        // OWNER / MANAGER
        // =========================================================
        const profileResponse = await apiClient.get("/profile");

        const profile = profileResponse.data;

        console.log("Login Profile Response:", profile);

        // Backend should return something like:
        // {
        //   username: "Bhavik",
        //   email: "bhavik@gmail.com",
        //   role: "OWNER",
        //   ...
        // }

        const backendRole = profile?.role?.toString().toUpperCase();

        const role: UserRole =
          backendRole === "OWNER" || backendRole === "MANAGER"
            ? backendRole
            : "MANAGER";

        const userObj: User = {
          username: profile?.username || username,
          role,
          token,
          email: profile?.email,
          id: profile?.id,
        };

        // Save actual backend user
        localStorage.setItem(USER_KEY, JSON.stringify(userObj));

        return {
          token,
          message: text,
          user: userObj,
        };
      }

      // =========================================================
      // CASE 2: Backend directly returns JSON
      // =========================================================
      if (typeof data === "object" && data !== null) {
        if (
          data.error ||
          (data.message &&
            data.message.toString().toLowerCase().includes("invalid"))
        ) {
          throw new Error(
            data.error || data.message || "Invalid Username and Password!",
          );
        }

        const token = data.token || data.Token;

        if (!token) {
          throw new Error("Login successful, but token was not returned.");
        }

        localStorage.setItem(TOKEN_KEY, token);

        // If /login itself returns role, use it.
        // Otherwise fetch /profile.
        let profile = data;

        if (!data.role) {
          const profileResponse = await apiClient.get("/profile");
          profile = profileResponse.data;
        }

        const backendRole = profile?.role?.toString().toUpperCase();

        const role: UserRole =
          backendRole === "OWNER" || backendRole === "MANAGER"
            ? backendRole
            : "MANAGER";

        const userObj: User = {
          username: profile?.username || username,
          role,
          token,
          email: profile?.email,
          id: profile?.id,
        };

        localStorage.setItem(USER_KEY, JSON.stringify(userObj));

        return {
          token,
          message: data.message || "LoggedIn Successfully!",
          user: userObj,
        };
      }

      throw new Error("Unexpected response format from server");
    } catch (err: any) {
      console.log(
        "Backend API Login Error:",
        err.response?.data || err.message,
      );

      // Remove bad session if login fails
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      if (err.response?.data && typeof err.response.data === "string") {
        throw new Error(err.response.data.trim());
      }

      if (
        err.message &&
        (err.message.includes("Invalid") ||
          err.message.includes("Already Logged In"))
      ) {
        throw err;
      }

      throw new Error(
        err.message || "Login failed. Please check backend connection.",
      );
    }
  },

  // Logout user: POST /logout
  async logout(): Promise<string> {
    try {
      const response = await apiClient.post<string>("/logout");
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return typeof response.data === "string"
        ? response.data
        : "You have LoggedOut Successfully!";
    } catch (err: any) {
      console.log("Logout API Error:", err.response?.data || err.message);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return "You have LoggedOut Successfully, and your Token has been Expired!";
    }
  },

  // Get user profile: GET /profile
  async getProfile(): Promise<User | string> {
    try {
      const response = await apiClient.get("/profile");
      return response.data;
    } catch (err: any) {
      console.log("Get Profile API Error:", err.response?.data || err.message);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        return JSON.parse(storedUser) as User;
      }
      return "Please Login Again";
    }
  },

  // Read saved user session
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  // Read saved auth token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
};
