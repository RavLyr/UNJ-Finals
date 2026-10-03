import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./luma.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RuangAcara",
  description: "Reservasi webinar dan e-ticketing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={plusJakartaSans.className}>
        {process.env.VERCEL_ENV === "preview" && (
          <aside role="status" className="border-b bg-muted p-3 text-center text-sm">
            Mode pratinjau: perubahan dan pendaftaran dinonaktifkan.
          </aside>
        )}
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
