import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  height: real("height").notNull(),
  weight: real("weight").notNull(),
  dietPreference: text("diet_preference").notNull().default("veg"),
  activityType: text("activity_type").notNull().default("home"),
  goal: text("goal").notNull().default("maintenance"),
  goalTimelineWeeks: integer("goal_timeline_weeks"),
  bmr: real("bmr"),
  targetCalories: real("target_calories"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
