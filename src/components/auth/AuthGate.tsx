"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, isAuthRequired } from "@/stores/authStore";

/**
 * Protects an app route. When `NEXT_PUBLIC_ENABLE_AUTH=true`, redirects to
 * `/login` unless the user is authenticated. Otherwise renders children (dev /
 * public mode), making the generator usable without a backend.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, authEnabled } = useAuthStore();

  useEffect(() => {
    if (authEnabled && !user) {
      router.replace("/login");
    }
  }, [router, user, authEnabled]);

  if (authEnabled && !user) {
    return null;
  }

  return <>{children}</>;
}

/** Hook: is the current user permitted to perform an action? */
export const useAuthRequired = () => {
  const { user } = useAuthStore();
  return isAuthRequired() ? Boolean(user) : true;
};
