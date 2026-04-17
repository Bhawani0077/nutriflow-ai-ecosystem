import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, usersTable, dietPlansTable, trackingLogsTable } from "@workspace/db";
import { GenerateDietPlanBody, GetDietPlansParams, GetTodayDietPlanParams } from "@workspace/api-zod";
import { generateDietPlanWithAI, calculateTargetCalories, calculateBMR, generateAdaptiveNote } from "../lib/ai-planner";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

router.post("/diet/generate", async (req, res): Promise<void> => {
  const parsed = GenerateDietPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const bmr = user.bmr ?? calculateBMR(user);
  const targetCalories = user.targetCalories ?? calculateTargetCalories(user, bmr);

  // Check yesterday's tracking for adaptive notes
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0]!;
  const [yesterdayLog] = await db
    .select()
    .from(trackingLogsTable)
    .where(and(eq(trackingLogsTable.userId, userId), eq(trackingLogsTable.day, yesterdayStr)));

  let adaptiveNote: string | null = null;
  if (yesterdayLog) {
    const [yesterdayDiet] = await db.select().from(dietPlansTable).where(eq(dietPlansTable.id, yesterdayLog.dietPlanId ?? -1));
    if (yesterdayDiet) {
      const allMealNames = (yesterdayDiet.meals as Array<{ name: string }>).map((m) => m.name);
      const followed = yesterdayLog.followedMeals as string[];
      const missed = allMealNames.filter((m) => !followed.includes(m));
      if (missed.length > 0 || !yesterdayLog.followedWorkout) {
        adaptiveNote = await generateAdaptiveNote(user, missed, !yesterdayLog.followedWorkout);
      }
    }
  }

  const today = getTodayStr();
  try {
    const { meals, notes } = await generateDietPlanWithAI(user, targetCalories, adaptiveNote ?? undefined);
    const totalCalories = meals.reduce((sum: number, m: { calories: number }) => sum + m.calories, 0);

    const [plan] = await db
      .insert(dietPlansTable)
      .values({
        userId,
        day: today,
        totalCalories,
        meals,
        notes: adaptiveNote ?? notes,
      })
      .returning();

    res.json(plan);
  } catch (err) {
    req.log.error({ err }, "Failed to generate diet plan");
    res.status(500).json({ error: "Failed to generate diet plan" });
  }
});

router.get("/diet/plans/:userId", async (req, res): Promise<void> => {
  const params = GetDietPlansParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rawLimit = req.query.limit;
  const limit = rawLimit ? parseInt(String(rawLimit), 10) : 7;

  const plans = await db
    .select()
    .from(dietPlansTable)
    .where(eq(dietPlansTable.userId, params.data.userId))
    .orderBy(desc(dietPlansTable.day))
    .limit(limit);

  res.json(plans);
});

router.get("/diet/plans/:userId/today", async (req, res): Promise<void> => {
  const params = GetTodayDietPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const today = getTodayStr();
  const [plan] = await db
    .select()
    .from(dietPlansTable)
    .where(and(eq(dietPlansTable.userId, params.data.userId), eq(dietPlansTable.day, today)));

  if (!plan) {
    res.status(404).json({ error: "No diet plan for today" });
    return;
  }

  res.json(plan);
});

export default router;
