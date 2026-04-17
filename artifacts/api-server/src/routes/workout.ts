import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, usersTable, workoutPlansTable } from "@workspace/db";
import { GenerateWorkoutPlanBody, GetWorkoutPlansParams, GetTodayWorkoutPlanParams } from "@workspace/api-zod";
import { generateWorkoutPlanWithAI } from "../lib/ai-planner";

const router: IRouter = Router();

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

router.post("/workout/generate", async (req, res): Promise<void> => {
  const parsed = GenerateWorkoutPlanBody.safeParse(req.body);
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

  const today = getTodayStr();
  const dayOfWeek = new Date().getDay();

  try {
    const { type, exercises, estimatedDuration, notes } = await generateWorkoutPlanWithAI(user, dayOfWeek);

    const [plan] = await db
      .insert(workoutPlansTable)
      .values({
        userId,
        day: today,
        type,
        exercises,
        estimatedDuration,
        notes,
      })
      .returning();

    res.json(plan);
  } catch (err) {
    req.log.error({ err }, "Failed to generate workout plan");
    res.status(500).json({ error: "Failed to generate workout plan" });
  }
});

router.get("/workout/plans/:userId", async (req, res): Promise<void> => {
  const params = GetWorkoutPlansParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rawLimit = req.query.limit;
  const limit = rawLimit ? parseInt(String(rawLimit), 10) : 7;

  const plans = await db
    .select()
    .from(workoutPlansTable)
    .where(eq(workoutPlansTable.userId, params.data.userId))
    .orderBy(desc(workoutPlansTable.day))
    .limit(limit);

  res.json(plans);
});

router.get("/workout/plans/:userId/today", async (req, res): Promise<void> => {
  const params = GetTodayWorkoutPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const today = getTodayStr();
  const [plan] = await db
    .select()
    .from(workoutPlansTable)
    .where(and(eq(workoutPlansTable.userId, params.data.userId), eq(workoutPlansTable.day, today)));

  if (!plan) {
    res.status(404).json({ error: "No workout plan for today" });
    return;
  }

  res.json(plan);
});

export default router;
