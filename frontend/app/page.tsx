"use client";

import { SERVER_URL } from "@/constants";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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

  const captionClass = "text-[0.68rem] font-bold uppercase text-[#587089]";
  const fieldClass =
    "h-11 w-full rounded-md border-0 bg-[#f4f6f8] px-3 text-sm font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-300/70 transition placeholder:font-normal placeholder:text-slate-400 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2f5f86]/35";
  const primaryButtonClass =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#17324a] px-4 text-sm font-semibold text-white transition hover:bg-[#10263a] focus:outline-none focus:ring-2 focus:ring-[#17324a]/20 disabled:cursor-not-allowed disabled:opacity-65";
  const steps: { id: Step; label: string }[] = [
    { id: "code", label: "Code" },
    { id: "setPassword", label: "Set Password" },
    { id: "login", label: "Login" },
  ];
  const activeStepIndex = steps.findIndex((item) => item.id === step);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef1f4] px-4 py-8 text-slate-950 sm:px-6">
      <section className="w-full max-w-2xl bg-[#fbfbfa] px-5 py-6 ring-1 ring-slate-200/80 sm:px-8 sm:py-7">
        <header className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-[#e7eef5] text-[#2f5f86]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-[#101827] sm:text-3xl">
            Academic Management System
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Secure access for institutional academic administration.
          </p>
        </header>

        <div className="mt-6 border-y border-slate-300/70 py-4">
          <div className="flex items-center gap-2">
            {steps.map((item, index) => {
              const isActive = item.id === step;
              const isComplete = index < activeStepIndex;

              return (
                <div
                  key={item.id}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-2 border-t pt-2 ${
                    isActive
                      ? "border-[#2f5f86] text-[#14324a]"
                      : isComplete
                        ? "border-[#2f7d5f] text-[#1f684c]"
                        : "border-slate-300 text-slate-500"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[0.68rem] font-bold ring-1 ring-inset ring-current">
                    {index + 1}
                  </span>
                  <span className="truncate text-xs font-bold uppercase">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          key={step}
          className="animate-step pt-5 transition-all duration-200 ease-out"
        >
          {step === "code" && (
            <form className="space-y-5" onSubmit={handleVerifyCode}>
              <div className="space-y-2">
                <label htmlFor="code" className={captionClass}>
                  Institution Access Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Enter issued access code"
                  autoComplete="off"
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClass}
              >
                <KeyRound className="h-4 w-4" />
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          {step === "setPassword" && (
            <form className="space-y-5" onSubmit={handleSetPassword}>
              <div className="space-y-2">
                <label htmlFor="new-password" className={captionClass}>
                  Create Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create password"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className={captionClass}>
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClass}
              >
                <LockKeyhole className="h-4 w-4" />
                {loading ? "Saving..." : "Set Password"}
              </button>
            </form>
          )}

          {step === "login" && (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label htmlFor="login-password" className={captionClass}>
                  Account Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClass}
              >
                <ShieldCheck className="h-4 w-4" />
                {loading ? "Authenticating..." : "Enter Platform"}
              </button>
            </form>
          )}
        </div>

        {(error || success) && (
          <p
            className={`mt-5 border-l-2 px-3 py-2 text-sm font-medium ${
              error
                ? "border-[#b64040] bg-[#fff7f7] text-[#8a1f1f]"
                : "border-[#2f7d5f] bg-[#f3faf7] text-[#1f684c]"
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
