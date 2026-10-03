import { z } from "zod";

// Shared Zod schemas — used by both client forms and Server Actions.

// Empty FormData strings → undefined for optional fields.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter"),
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .max(200, "Email maksimal 200 karakter")
    .transform((email) => email.toLowerCase()),
  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(8, "Nomor telepon minimal 8 karakter")
      .max(20, "Nomor telepon maksimal 20 karakter")
      .optional(),
  ),
});

export const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter")
    .max(200, "Judul maksimal 200 karakter"),
  description: z
    .string()
    .trim()
    .min(1, "Deskripsi wajib diisi")
    .max(5000, "Deskripsi maksimal 5000 karakter"),
  dateTime: z.coerce.date({
    message: "Tanggal dan waktu wajib diisi",
  }),
  maxQuota: z.coerce
    .number({ message: "Kuota wajib diisi" })
    .int("Kuota harus bilangan bulat")
    .min(1, "Kuota minimal 1"),
  speaker: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(200, "Nama pembicara maksimal 200 karakter")
      .optional(),
  ),
  bannerUrl: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .url("URL banner tidak valid")
      .max(500, "URL banner maksimal 500 karakter")
      .optional(),
  ),
  tags: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(200, "Tag maksimal 200 karakter")
      .refine(
        (value) => !value || value.split(",").length <= 5,
        "Maksimal 5 tag",
      )
      .optional(),
  ),
});

// Schema for setEventStatus — partial event fields + lifecycle data.
export const eventStatusSchema = z.object({
  status: z.enum(["draft", "published", "cancelled", "completed"] as const, {
    message: "Status tidak valid",
  }),
  cancellationReason: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(1, "Alasan pembatalan wajib diisi")
      .max(1000, "Alasan pembatalan maksimal 1000 karakter")
      .optional(),
  ),
});
