"use client";

import { SERVER_URL } from "@/constants";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Step = "code" | "setPassword" | "login";

type VerifyCodeResponse = {
  exists?: boolean;
  isPasswordSet?: boolean;
  message?: string;
};

type ApiMessageResponse = {
  message?: string;
  role?: string;
};

export default function Home() {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  const stepLabel = useMemo(() => {
    if (step === "setPassword") return "Set Password";
    if (step === "login") return "Enter Password";
    return "Enter Code";
  }, [step]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Please enter your code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${SERVER_URL}/auth/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as VerifyCodeResponse;

      if (!response.ok || !data.exists) {
        setError(data.message ?? "Invalid code. Please try again.");
        return;
      }

      if (data.isPasswordSet) {
        setPassword("");
        setStep("login");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setStep("setPassword");
    } catch {
      setError("Unable to verify code right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${SERVER_URL}/auth/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim(), password }),
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as ApiMessageResponse;

      if (!response.ok) {
        setError(data.message ?? "Unable to set password. Please try again.");
        return;
      }

      setSuccess(
        data.message ?? "Password set successfully. You can now log in.",
      );
      setPassword("");
      setConfirmPassword("");
      setStep("login");
    } catch {
      setError("Unable to set password right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${SERVER_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim(), password }),
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as ApiMessageResponse;

      if (!response.ok) {
        setError(data.message ?? "Login failed. Please check your password.");
        return;
      }

      setSuccess(data.message ?? "Login successful.");
      router.push(data.role?.toLowerCase() || "/");
      setPassword("");
    } catch {
      setError("Unable to log in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--color-primary)] px-4 py-10 text-slate-900 sm:px-6">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold">Academic Management System</h1>
          <p className="text-sm text-slate-600">Enter your code to continue</p>
        </header>

        <div
          key={step}
          className="animate-step transition-all duration-200 ease-out"
        >
          <p className="mb-4 text-sm font-medium text-slate-700">{stepLabel}</p>

          {step === "code" && (
            <form className="space-y-4" onSubmit={handleVerifyCode}>
              <div className="space-y-2">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-slate-700"
                >
                  Enter Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Enter Code"
                  autoComplete="off"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          )}

          {step === "setPassword" && (
            <form className="space-y-4" onSubmit={handleSetPassword}>
              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create password"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-slate-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Saving..." : "Set Password"}
              </button>
            </form>
          )}

          {step === "login" && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}
        </div>

        {(error || success) && (
          <p
            className={`mt-4 rounded-md border px-3 py-2 text-sm ${
              error
                ? "border-secondary/45 bg-[color:var(--color-primary)] text-slate-800"
                : "border-tertiary/50 bg-[color:var(--color-primary)] text-slate-800"
            }`}
            role="status"
          >
            {error || success}
          </p>
        )}

        <style jsx>{`
          .animate-step {
            animation: fade-slide 180ms ease-out;
          }

          @keyframes fade-slide {
            from {
              opacity: 0;
              transform: translateY(4px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </section>
    </main>
  );
}
