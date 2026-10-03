"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const TICKET_PATTERN = /^WBN-[0-9]{8}-[A-Z0-9]{4}$/;
const DETECT_INTERVAL_MS = 250;

type ScannerState = "idle" | "starting" | "scanning" | "unsupported" | "denied" | "error";

// Declared locally so the component does not depend on lib.dom shipping
// BarcodeDetector types yet.
type QrDetector = {
  detect(source: CanvasImageSource): Promise<{ rawValue?: string }[]>;
  getSupportedFormats?: () => Promise<string[]>;
};
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector;

function qrDetector(): QrDetectorConstructor | null {
  const candidate = (globalThis as { BarcodeDetector?: QrDetectorConstructor }).BarcodeDetector;
  return typeof candidate === "function" ? candidate : null;
}

function readError(error: unknown): { state: ScannerState; message: string } {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return { state: "denied", message: "Akses kamera ditolak. Izinkan kamera di pengaturan browser, atau gunakan input ID tiket manual." };
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return { state: "error", message: "Kamera tidak ditemukan pada perangkat ini. Gunakan input ID tiket manual." };
  }
  return { state: "error", message: "Kamera tidak dapat dinyalakan. Gunakan input ID tiket manual." };
}

async function qrSupported() {
  const Detector = qrDetector();
  if (!Detector) return false;
  try {
    const detector = new Detector({ formats: ["qr_code"] });
    const formats = await detector.getSupportedFormats?.() ?? [];
    return formats.length === 0 || formats.includes("qr_code");
  } catch {
    return false;
  }
}

export function CheckInScanner({ onDetect, disabled = false }: { onDetect: (ticketId: string) => void; disabled?: boolean }) {
  const id = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRef = useRef<{ value: string; at: number } | null>(null);
  const [state, setState] = useState<ScannerState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  const start = useCallback(async () => {
    setState("starting");
    setMessage("Menyiapkan kamera...");
    if (!await qrSupported()) {
      setState("unsupported");
      setMessage("Browser ini belum mendukung pemindaian QR. Gunakan input ID tiket manual di atas.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return stop();
      video.srcObject = stream;
      await video.play();
      const Detector = qrDetector();
      if (!Detector) {
        stop();
        setState("unsupported");
        setMessage("Browser ini belum mendukung pemandaian QR. Gunakan input ID tiket manual di atas.");
        return;
      }
      const detector = new Detector({ formats: ["qr_code"] });
      setState("scanning");
      setMessage("Arahkan kamera ke QR tiket.");
      timerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const codes = await detector.detect(videoRef.current);
          for (const code of codes) {
            const value = (code.rawValue ?? "").trim().toUpperCase();
            if (!TICKET_PATTERN.test(value)) continue;
            const now = Date.now();
            if (lastRef.current?.value === value && now - lastRef.current.at < 4000) continue;
            lastRef.current = { value, at: now };
            navigator.vibrate?.(50);
            onDetect(value);
            setMessage(`QR terbaca: ${value}`);
            return;
          }
        } catch {
          setMessage("Gagal membaca QR. Coba lagi atau gunakan input manual.");
        }
      }, DETECT_INTERVAL_MS);
    } catch (error) {
      const failure = readError(error);
      setState(failure.state);
      setMessage(failure.message);
    }
  }, [onDetect, stop]);

  return <section aria-labelledby={`${id}-scanner`} className="space-y-3 rounded-md border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 id={`${id}-scanner`} className="text-base font-semibold">Pindai QR tiket</h3>
      {state === "scanning" || state === "starting" ? (
        <button type="button" onClick={stop} className="min-h-11 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Matikan kamera
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="min-h-11 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "unsupported" || state === "denied" || state === "error" ? "Coba lagi" : "Aktifkan kamera"}
        </button>
      )}
    </div>
    <div className="relative overflow-hidden rounded-md bg-muted">
      <video
        ref={videoRef}
        playsInline
        muted
        aria-label="Pratinjau kamera untuk pemindaian QR tiket"
        className={`aspect-[4/3] w-full object-cover ${state === "scanning" || state === "starting" ? "" : "hidden"}`}
      />
      {state !== "scanning" && state !== "starting" && (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Kamera belum aktif.</p>
      )}
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    <p className="text-xs text-muted-foreground">
      Kamera bersifat opsional. Input ID tiket manual di atas tetap dapat digunakan kapan saja.
    </p>
  </section>;
}
