import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role", { enum: ["organizer", "attendee", "platform_admin"] }).notNull().default("attendee"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("users_role_check", sql`${table.role} in ('organizer', 'attendee', 'platform_admin')`),
]).enableRLS();

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull().unique().references(() => users.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  dateTime: timestamp("date_time", { withTimezone: true }).notNull(),
  maxQuota: integer("max_quota").notNull(),
  registeredCount: integer("registered_count").notNull().default(0),
  speaker: text("speaker"),
  bannerUrl: text("banner_url"),
  tags: text("tags"),
  status: text("status", { enum: ["draft", "published", "cancelled", "completed"] }).notNull().default("draft"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("events_workspace_slug_active_unique").on(table.workspaceId, table.slug).where(sql`${table.deletedAt} is null`),
  check("events_max_quota_check", sql`${table.maxQuota} > 0`),
  check("events_status_check", sql`${table.status} in ('draft', 'published', 'cancelled', 'completed')`),
]).enableRLS();

export const registrations = pgTable("registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id),
  attendeeId: uuid("attendee_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  ticketId: text("ticket_id").notNull().unique(),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("registrations_event_email_unique").on(table.eventId, table.email),
  check("registrations_email_lowercase_check", sql`${table.email} = lower(${table.email})`),
]).enableRLS();
