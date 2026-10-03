"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function RegistrationSuccessToast({ email }: { email: string }) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast.success("Pendaftaran berhasil! Simpan tiket Anda.");
    toast.success(`Email konfirmasi telah dikirim ke ${email}`);
  }, [email]);

  return null;
}
