import { pgTable, text, serial, integer, real, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trackingLogsTable = pgTable("tracking_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  day: text("day").notNull(),
  dietPlanId: integer("diet_plan_id"),
  workoutPlanId: integer("workout_plan_id"),
  followedMeals: json("followed_meals").notNull().$type<string[]>(),
  followedWorkout: boolean("followed_workout").notNull().default(false),
  weight: real("weight"),
  notes: text("notes"),
  dietCompliancePercent: real("diet_compliance_percent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrackingLogSchema = createInsertSchema(trackingLogsTable).omit({ id: true, createdAt: true });
export type InsertTrackingLog = z.infer<typeof insertTrackingLogSchema>;
export type TrackingLog = typeof trackingLogsTable.$inferSelect;
