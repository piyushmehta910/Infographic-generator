"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, authEnabled } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authEnabled) {
    // Auth is disabled — redirect silently into the app.
    router.replace("/generate");
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace("/generate");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">
            Sign in to InfoGraphic AI
          </h1>
          <p className="text-surface-400 text-sm mt-2">
            Bring your own AI key. We never store your credentials.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-xl bg-surface-800/60 border border-white/10 text-white placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={1}
            className="w-full h-12 px-4 rounded-xl bg-surface-800/60 border border-white/10 text-white placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-surface-400">
          Or continue with
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="w-full mt-3"
          onClick={async () => {
            setSubmitting(true);
            try {
              await signInWithGoogle();
              router.replace("/generate");
            } catch (err: any) {
              setError(err?.message || "Google sign-in failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <GoogleIcon className="w-4 h-4" /> Google
        </Button>

        <p className="mt-6 text-center text-xs text-surface-500">
          New here?{" "}
          <a
            href="/pricing"
            className="text-brand-400 hover:text-white transition-colors"
          >
            View pricing
          </a>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.552 10.34H21.6V10.5h-8.5V14h8.5c-.71 1.83-2.66 3.12-4.8 3.12-2.95 0-5.33-2.37-5.33-5.3s2.38-5.3 5.33-5.3c2.11 0 3.99 1.21 4.76 3l3.5-2.72C20.16 5.19 16.85 2 12.3 2 7.15 2 3.05 6.11 3.05 11.26S7.15 20.5 12.3 20.5c4.15 0 7.81-2.98 8.25-7.16z"
        fill="currentColor"
      />
    </svg>
  );
}
