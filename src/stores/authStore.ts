"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type Plan = "free" | "pro" | "team";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: Plan;
  credits: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  // config
  authEnabled: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<AuthUser>;
  signOut: () => void;
  refresh: () => void;
}

export type AuthStore = AuthState & AuthActions;

const AUTH_ENABLED =
  (process.env.NEXT_PUBLIC_ENABLE_AUTH || "").toLowerCase() === "true";

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isLoading: false,
        authEnabled: AUTH_ENABLED,

        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),
        setLoading: (loading) => set({ isLoading: loading }),

        signOut: () => {
          set({ user: null, token: null });
          try {
            localStorage.removeItem("ifg_user");
          } catch {
            /* ignore */
          }
        },

        signIn: async (email, _password) => {
          set({ isLoading: true });
          try {
            // Dev / unconfigured fallback: create an ephemeral user so the app
            // is fully usable without a backend. Replace with a real
            // Firebase/Clerk sign-in call when NEXT_PUBLIC_ENABLE_AUTH=true.
            const user: AuthUser = {
              uid: "dev_" + Math.random().toString(36).slice(2, 11),
              email,
              displayName: email.split("@")[0],
              photoURL: null,
              plan: "free",
              credits: 5,
            };
            const token = btoa(email + ":" + user.uid);
            set({ user, token, isLoading: false });
            return user;
          } catch (e) {
            set({ isLoading: false });
            throw e;
          }
        },

        signInWithGoogle: async () => {
          set({ isLoading: true });
          try {
            // Dev fallback — simulates a Google sign-in.
            const email = "user@example.com";
            const user: AuthUser = {
              uid: "dev_google_" + Math.random().toString(36).slice(2, 11),
              email,
              displayName: "Demo User",
              photoURL: null,
              plan: "free",
              credits: 5,
            };
            const token = btoa(email + ":" + user.uid);
            set({ user, token, isLoading: false });
            return user;
          } catch (e) {
            set({ isLoading: false });
            throw e;
          }
        },

        refresh: () => {
          // no-op for dev fallback; real impl would refresh the session
        },
      }),
      {
        name: "ifg-auth",
        partialize: (state) => ({
          user: state.user,
          token: state.token,
        }),
      },
    ),
    { name: "ifg-auth" },
  ),
);

/** True when auth-gated routes should require a logged-in user. */
export const isAuthRequired = () => useAuthStore.getState().authEnabled;
