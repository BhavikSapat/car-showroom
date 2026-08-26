import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, UserRole } from "../types";
import { authService } from "../services/authService";
import { useToast } from "../components/common/Toast";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      setRole(null);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  }, []);

  // Initialize auth state from local storage on load
  useEffect(() => {
    const initAuth = () => {
      const storedToken = authService.getToken();
      const storedUser = authService.getCurrentUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setRole(storedUser.role);
      } else {
        // Default to a initial session state or force login
        setUser(null);
        setToken(null);
        setRole(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Listen to expired token events from axios interceptor
  useEffect(() => {
    const handleExpired = (e: any) => {
      const detail = e.detail || "Token Expired! Please Login Again.";
      toast.warning("Session Expired", detail);
      handleLogout();
    };

    const handleUnauthorized = () => {
      toast.error(
        "Access Denied",
        "Please log in with appropriate credentials.",
      );
      handleLogout();
    };

    window.addEventListener("auth:token_expired", handleExpired);
    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:token_expired", handleExpired);
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [handleLogout, toast]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(username, password);
      if (result.user) {
        setUser(result.user);
        setToken(result.token);
        setRole(result.user.role);
        toast.success(
          "Welcome Back",
          `Logged in successfully as ${result.user.role}`,
        );
      }
    } catch (err: any) {
      const msg = err.message || "Login failed. Please verify credentials.";
      toast.error("Login Failed", msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      if (typeof profile !== "string") {
        setUser(profile);
        setRole(profile.role);
      }
    } catch (err) {
      console.warn("Could not refresh profile", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
