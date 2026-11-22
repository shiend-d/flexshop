"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRightIcon,
  SpinnerIcon,
  StoreIcon,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type Mode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : { store_name: storeName, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-stone-900 transition-colors dark:bg-stone-100">
            <StoreIcon className="h-6 w-6 text-stone-50 transition-colors dark:text-stone-900" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 transition-colors dark:text-stone-50">
            FlexShop
          </h1>
          <p className="mt-1 text-sm text-stone-500 transition-colors dark:text-stone-400">
            {mode === "login"
              ? "Masuk untuk mengelola toko Anda"
              : "Daftarkan toko baru dalam satu menit"}
          </p>
        </div>

        <div
          className={`rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm transition-colors dark:border-stone-800/80 dark:bg-stone-900/70 ${
            error ? "shake" : ""
          }`}
        >
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 transition-colors dark:border-red-800/50 dark:bg-red-950/30">
              <p className="text-[12.5px] font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-5">
            {mode === "register" ? (
              <Field
                id="store-name"
                label="Nama Toko"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                placeholder="Contoh: Toko Sembako Jaya"
                autoComplete="organization"
                maxLength={100}
                required
              />
            ) : null}

            <Field
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@toko.id"
              autoComplete="email"
              required
            />

            <Field
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="········"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={6}
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3"
            >
              {loading ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : null}
              {loading
                ? "Memproses..."
                : mode === "login"
                  ? "Masuk"
                  : "Daftar & Masuk"}
              {!loading ? <ArrowRightIcon className="h-4 w-4" /> : null}
            </Button>
          </form>

          <div className="mt-4 border-t border-stone-200/50 pt-4 text-center transition-colors dark:border-stone-800/50">
            <button
              type="button"
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
              className="text-[12.5px] font-medium text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            >
              {mode === "login"
                ? "Belum punya toko? Daftar"
                : "Sudah punya akun? Masuk"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
