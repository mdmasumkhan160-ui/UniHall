import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();

  // Removed legacy seed injection (legacyApi.ensureSeedData) to ensure only real backend data is used.

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setIsAuthLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    if (!data?.token || !data?.user) {
      throw new Error("Login failed");
    }
    localStorage.setItem("auth_token", data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async ({
    name,
    email,
    password,
    studentId,
    programLevel,
  }) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      studentId,
      programLevel,
    });
    if (!data?.token || !data?.user) {
      throw new Error("Registration failed");
    }
    localStorage.setItem("auth_token", data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    navigate("/");
  };

  const value = useMemo(
    () => ({ user, login, logout, register, isAuthLoading }),
    [user, isAuthLoading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
