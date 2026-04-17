import { pgTable, text, serial, integer, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mealSchema = z.object({
  name: z.string(),
  time: z.string(),
  items: z.array(z.string()),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  why: z.string(),
});

export type Meal = z.infer<typeof mealSchema>;

export const dietPlansTable = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  day: text("day").notNull(),
  totalCalories: real("total_calories").notNull(),
  meals: json("meals").notNull().$type<Meal[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDietPlanSchema = createInsertSchema(dietPlansTable).omit({ id: true, createdAt: true });
export type InsertDietPlan = z.infer<typeof insertDietPlanSchema>;
export type DietPlan = typeof dietPlansTable.$inferSelect;
