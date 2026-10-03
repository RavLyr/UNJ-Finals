"use client";

import { useState } from "react";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import vfsFonts from "pdfmake/build/vfs_fonts";

interface TicketPdfData {
  ticketId: string;
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  speaker: string | null;
}

interface PdfMakeBrowser {
  addVirtualFileSystem(vfs: typeof vfsFonts): void;
  createPdf(doc: TDocumentDefinitions): { download(filename?: string): Promise<void> };
}

let cachedPdfMake: PdfMakeBrowser | null = null;

async function loadPdfMake(): Promise<PdfMakeBrowser> {
  if (cachedPdfMake) return cachedPdfMake;
  const mod = await import("pdfmake/build/pdfmake");
  // @types/pdfmake declares named exports for this entry, but the 0.3.x UMD
  // bundle exposes the instance as `default` (verified in build/pdfmake.js).
  const instance = (mod as unknown as { default: PdfMakeBrowser }).default;
  instance.addVirtualFileSystem(vfsFonts);
  cachedPdfMake = instance;
  return instance;
}

export function TicketPdfButton({ ticket }: { ticket: TicketPdfData }) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const pdfMake = await loadPdfMake();
      const doc: TDocumentDefinitions = {
        content: [
          { text: "E-Tiket RuangAcara", style: "header" },
          { text: ticket.eventTitle, style: "eventTitle" },
          { qr: ticket.ticketId, fit: 180, alignment: "center", margin: [0, 12, 0, 12] },
          { text: ticket.ticketId, style: "ticketId", alignment: "center" },
          {
            table: {
              widths: ["30%", "70%"],
              body: [
                ["Nama", ticket.name],
                ["Email", ticket.email],
                ["Event", ticket.eventTitle],
                ["Tanggal", ticket.eventDate],
                ...(ticket.speaker ? [["Pembicara", ticket.speaker]] : []),
              ],
            },
            layout: "noBorders",
            margin: [0, 12, 0, 0],
          },
          {
            text: "Tunjukkan QR code ini saat check-in.",
            style: "note",
            margin: [0, 16, 0, 0],
          },
        ],
        styles: {
          header: { fontSize: 20, bold: true, alignment: "center", margin: [0, 0, 0, 4] },
          eventTitle: { fontSize: 14, alignment: "center", color: "#666666" },
          ticketId: { fontSize: 12, bold: true, color: "#4f46e5" },
          note: { fontSize: 10, italics: true, color: "#666666", alignment: "center" },
        },
      };
      await pdfMake.createPdf(doc).download(`${ticket.ticketId}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn--primary" onClick={handleDownload} disabled={busy}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {busy ? "Menyiapkan PDF..." : "Download PDF"}
    </button>
  );
}
