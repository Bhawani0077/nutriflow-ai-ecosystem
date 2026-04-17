import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, trackingLogsTable, dietPlansTable } from "@workspace/db";
import { LogDailyTrackingBody, GetUserTrackingParams, GetTodayTrackingParams } from "@workspace/api-zod";

const router: IRouter = Router();

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

router.post("/tracking/log", async (req, res): Promise<void> => {
  const parsed = LogDailyTrackingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const today = getTodayStr();

  // Calculate diet compliance
  let dietCompliancePercent = 0;
  if (data.dietPlanId) {
    const [plan] = await db.select().from(dietPlansTable).where(eq(dietPlansTable.id, data.dietPlanId));
    if (plan) {
      const totalMeals = (plan.meals as Array<{ name: string }>).length;
      const followedCount = (data.followedMeals as string[]).length;
      dietCompliancePercent = totalMeals > 0 ? (followedCount / totalMeals) * 100 : 0;
    }
  } else {
    // If no plan ID, compliance based on followed meals vs standard 4 meals
    dietCompliancePercent = ((data.followedMeals as string[]).length / 4) * 100;
  }

  const [log] = await db
    .insert(trackingLogsTable)
    .values({
      userId: data.userId,
      day: today,
      dietPlanId: data.dietPlanId ?? null,
      workoutPlanId: data.workoutPlanId ?? null,
      followedMeals: data.followedMeals,
      followedWorkout: data.followedWorkout,
      weight: data.weight ?? null,
      notes: data.notes ?? null,
      dietCompliancePercent,
    })
    .returning();

  res.status(201).json(log);
});

router.get("/tracking/:userId", async (req, res): Promise<void> => {
  const params = GetUserTrackingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rawLimit = req.query.limit;
  const limit = rawLimit ? parseInt(String(rawLimit), 10) : 14;

  const logs = await db
    .select()
    .from(trackingLogsTable)
    .where(eq(trackingLogsTable.userId, params.data.userId))
    .orderBy(desc(trackingLogsTable.day))
    .limit(limit);

  res.json(logs);
});

router.get("/tracking/:userId/today", async (req, res): Promise<void> => {
  const params = GetTodayTrackingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const today = getTodayStr();
  const [log] = await db
    .select()
    .from(trackingLogsTable)
    .where(and(eq(trackingLogsTable.userId, params.data.userId), eq(trackingLogsTable.day, today)));

  if (!log) {
    res.status(404).json({ error: "No tracking for today" });
    return;
  }

  res.json(log);
});

export default router;
