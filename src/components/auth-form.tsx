"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { registerAccount, signInAction } from "@/server/actions/auth";

export function AuthForm({ mode, returnUrl, registered = false, preview = false }: {
  mode: "signin" | "register";
  returnUrl?: string;
  registered?: boolean;
  preview?: boolean;
}) {
  const signup = mode === "register";
  const [state, action, pending] = useActionState(signup ? registerAccount : signInAction, null);
  const form = useRef<HTMLFormElement>(null);
  const errors = state && !state.success ? state.fieldErrors : undefined;
  useEffect(() => {
    if (state && !state.success) {
      const firstInvalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (firstInvalid ?? form.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus();
    }
  }, [state]);
  const fields = [
    ...(signup ? [{ name: "name", label: "Nama", type: "text", autoComplete: "name" }] : []),
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "password", label: "Kata sandi", type: "password", autoComplete: signup ? "new-password" : "current-password" },
    ...(signup ? [{ name: "confirmPassword", label: "Konfirmasi kata sandi", type: "password", autoComplete: "new-password" }] : []),
  ];
  const alternate = signup ? "/signin" : "/register";
  return (
    <main className="mx-auto w-full max-w-md px-5 py-12 md:py-20">
      <Link href="/" className="text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">RuangAcara</Link>
      <h1 className="mt-10 text-3xl font-bold tracking-tight">{signup ? "Buat akun" : "Masuk"}</h1>
      <p className="mt-3 text-muted-foreground">{signup ? "Daftar untuk mengikuti atau menyelenggarakan event." : "Kelola event atau lihat tiket Anda."}</p>
      {registered && <p role="status" className="mt-6 rounded-md bg-muted p-3 text-sm">Akun berhasil dibuat. Silakan masuk.</p>}
      <form ref={form} action={action} className="mt-8 space-y-5" aria-busy={pending}>
        <input type="hidden" name="redirect" value={returnUrl ?? ""} />
        {state && !state.success && <p role="alert" tabIndex={-1} className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm font-medium">{field.label}</label>
            <input name={field.name} type={field.type} autoComplete={field.autoComplete} id={field.name} required
              maxLength={field.name === "name" ? 100 : field.name === "email" ? 200 : undefined}
              aria-invalid={Boolean(errors?.[field.name])}
              aria-describedby={errors?.[field.name] ? `${field.name}-error` : undefined}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-red-700" />
            {errors?.[field.name] && <p id={`${field.name}-error`} className="text-sm text-red-700">{errors[field.name]}</p>}
          </div>
        ))}
        {signup && <div className="space-y-2">
          <label htmlFor="role" className="block text-sm font-medium">Jenis akun</label>
          <select name="role" id="role" defaultValue="attendee" required aria-invalid={Boolean(errors?.role)} aria-describedby={errors?.role ? "role-error" : undefined}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <option value="attendee">Peserta — mengikuti event</option>
            <option value="organizer">Organizer — menyelenggarakan event</option>
          </select>
          {errors?.role && <p id="role-error" className="text-sm text-red-700">{errors.role}</p>}
        </div>}
        <button type="submit" disabled={pending || (signup && preview)} className="h-11 w-full rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? (signup ? "Mendaftarkan..." : "Memproses...") : signup ? "Daftar" : "Masuk"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">{signup ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <Link href={`${alternate}${returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : ""}`} className="font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">{signup ? "Masuk" : "Daftar"}</Link>
      </p>
    </main>
  );
}
