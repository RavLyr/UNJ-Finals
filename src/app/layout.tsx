import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "RuangAcara",
  description: "Reservasi webinar dan e-ticketing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
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
