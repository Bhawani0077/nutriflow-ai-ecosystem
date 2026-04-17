import { pgTable, text, serial, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const foodItemsTable = pgTable("food_items", {
  id: serial("id").primaryKey(),
  shopName: text("shop_name").notNull(),
  foodName: text("food_name").notNull(),
  price: real("price").notNull(),
  distance: text("distance").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fats: real("fats").notNull(),
  nutritionScore: real("nutrition_score").notNull(),
  isVeg: boolean("is_veg").notNull().default(true),
  category: text("category").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFoodItemSchema = createInsertSchema(foodItemsTable).omit({ id: true, createdAt: true });
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItemsTable.$inferSelect;
