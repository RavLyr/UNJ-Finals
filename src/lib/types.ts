// Shared types — single source of truth per CONTRACT.md §4.

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "organizer" | "attendee" | "platform_admin";
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
}

export interface Event {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  description: string;
  dateTime: Date;
  maxQuota: number;
  registeredCount: number;
  speaker: string | null;
  bannerUrl: string | null;
  tags: string | null;
  status: "draft" | "published" | "cancelled" | "completed";
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Registration {
  id: string;
  eventId: string;
  attendeeId: string;
  name: string;
  email: string;
  phone: string | null;
  ticketId: string;
  checkedInAt: Date | null;
  createdAt: Date;
}
