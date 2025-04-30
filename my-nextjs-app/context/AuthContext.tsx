"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  register: (username: string, password: string, confirmPassword: string) => Promise<void>;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("authToken");
      const storedUsername = localStorage.getItem("username");
      console.log("Loaded from localStorage - Token:", storedToken, "Username:", storedUsername); // Debug log
      if (storedToken && storedUsername) {
        setToken(storedToken);
        setUsername(storedUsername);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      setIsAuthenticated(false);
    }
  }, []);

  const login = (token: string, username: string) => {
    try {
      setToken(token);
      setUsername(username);
      setIsAuthenticated(true);
      localStorage.setItem("authToken", token);
      localStorage.setItem("username", username);
      console.log("Stored in localStorage - Token:", token, "Username:", username); // Debug log
    } catch (error) {
      console.error("Error during login:", error);
      throw new Error("Failed to set authentication state");
    }
  };

  const register = async (username: string, password: string, confirmPassword: string) => {
    try {
      setLoading(true);
      const response = await api.post("/api/register", { username, password, confirmPassword });
      if (response.status !== 201) {
        throw new Error(response.data?.message || "Registration failed");
      }

      const loginResponse = await api.post("/api/login", { username, password });
      if (loginResponse.status !== 200) {
        throw new Error(loginResponse.data?.message || "Auto-login after registration failed");
      }

      const loginData = loginResponse.data;
      login(loginData.token, loginData.username);
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.response?.data?.message || error.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      setToken(null);
      setUsername(null);
      setIsAuthenticated(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      console.log("Logged out - Cleared localStorage"); // Debug log
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      throw new Error("Failed to clear authentication state");
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, username, isAuthenticated, loading, register, login, logout }}
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