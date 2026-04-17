import { Router, type IRouter } from "express";
import { lte, gte, eq } from "drizzle-orm";
import { db, foodItemsTable } from "@workspace/db";
import { AnalyzeFoodBody } from "@workspace/api-zod";
import { analyzeFoodWithAI } from "../lib/ai-planner";

const router: IRouter = Router();

router.post("/food/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeFoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const result = await analyzeFoodWithAI(
      parsed.data.foodName,
      parsed.data.quantity,
      parsed.data.imageDescription
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze food");
    res.status(500).json({ error: "Failed to analyze food" });
  }
});

router.get("/food/nearby", async (req, res): Promise<void> => {
  const budget = parseFloat(String(req.query.budget ?? "500"));
  const preference = String(req.query.preference ?? "any");

  let query = db.select().from(foodItemsTable).where(lte(foodItemsTable.price, budget));

  const items = await query;

  let filtered = items;
  if (preference === "veg") {
    filtered = items.filter((item) => item.isVeg);
  } else if (preference === "non-veg") {
    filtered = items.filter((item) => !item.isVeg);
  }

  // Sort by nutrition score (nutrition per cost ratio)
  filtered.sort((a, b) => b.nutritionScore - a.nutritionScore);

  res.json(filtered.slice(0, 20));
});

export default router;
