"use client";

import { useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";

type Mode = "sign-in" | "sign-up";

function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "Firebase Auth is not configured.") {
    return error.message;
  }
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/missing-password":
    case "auth/weak-password":
      return "Use a password of at least 6 characters.";
    case "auth/email-already-in-use":
      return "An account already exists for that email. Sign in instead.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was closed before it finished.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google sign-in in Firebase Auth.";
    default:
      return "Sign-in failed. Try again.";
  }
}

export default function AuthForm() {
  const { configured, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuthContext();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (mode === "sign-up") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      {!configured && (
        <p
          className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3"
          role="status"
        >
          Firebase Auth is not configured. Set the{" "}
          <code>NEXT_PUBLIC_FIREBASE_*</code> values to enable sign-in.
        </p>
      )}
      <div className="flex gap-2" role="group" aria-label="Account action">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm ${
            mode === "sign-in" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
          }`}
          aria-pressed={mode === "sign-in"}
          onClick={() => setMode("sign-in")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm ${
            mode === "sign-up" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
          }`}
          aria-pressed={mode === "sign-up"}
          onClick={() => setMode("sign-up")}
        >
          Create account
        </button>
      </div>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Password
        <input
          type="password"
          name="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
        />
      </label>
      {formError && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2" role="alert">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={!configured || submitting}
        className="rounded-md bg-blue-700 px-3 py-2 text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {mode === "sign-up" ? "Create account" : "Sign in"}
      </button>
      <button
        type="button"
        disabled={!configured || submitting}
        onClick={onGoogle}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        Continue with Google
      </button>
    </form>
  );
}
