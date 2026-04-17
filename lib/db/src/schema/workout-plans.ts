import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
  duration: z.string().nullable().optional(),
  muscleGroup: z.string(),
  why: z.string(),
});

export type Exercise = z.infer<typeof exerciseSchema>;

export const workoutPlansTable = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  day: text("day").notNull(),
  type: text("type").notNull().default("strength"),
  exercises: json("exercises").notNull().$type<Exercise[]>(),
  estimatedDuration: integer("estimated_duration").notNull().default(45),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkoutPlanSchema = createInsertSchema(workoutPlansTable).omit({ id: true, createdAt: true });
export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;
export type WorkoutPlan = typeof workoutPlansTable.$inferSelect;
