import { Router, type IRouter } from "express";
import { eq, desc, and, gte } from "drizzle-orm";
import { db, usersTable, dietPlansTable, workoutPlansTable, trackingLogsTable } from "@workspace/db";
import { GetDashboardSummaryParams, GetUserProgressParams } from "@workspace/api-zod";

const router: IRouter = Router();

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0]!;
}

router.get("/dashboard/:userId", async (req, res): Promise<void> => {
  const params = GetDashboardSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId } = params.data;
  const today = getTodayStr();
  const sevenDaysAgo = getDateStr(7);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Get today's plans
  const [todayDietPlan] = await db
    .select()
    .from(dietPlansTable)
    .where(and(eq(dietPlansTable.userId, userId), eq(dietPlansTable.day, today)));

  const [todayWorkoutPlan] = await db
    .select()
    .from(workoutPlansTable)
    .where(and(eq(workoutPlansTable.userId, userId), eq(workoutPlansTable.day, today)));

  const [todayTracking] = await db
    .select()
    .from(trackingLogsTable)
    .where(and(eq(trackingLogsTable.userId, userId), eq(trackingLogsTable.day, today)));

  // Get last 7 days of tracking for compliance stats
  const recentLogs = await db
    .select()
    .from(trackingLogsTable)
    .where(and(eq(trackingLogsTable.userId, userId), gte(trackingLogsTable.day, sevenDaysAgo)))
    .orderBy(desc(trackingLogsTable.day));

  const weeklyDietCompliance =
    recentLogs.length > 0
      ? recentLogs.reduce((sum, log) => sum + (log.dietCompliancePercent ?? 0), 0) / recentLogs.length
      : 0;

  const weeklyWorkoutCompliance =
    recentLogs.length > 0
      ? (recentLogs.filter((log) => log.followedWorkout).length / recentLogs.length) * 100
      : 0;

  // Calculate streak (consecutive days with >= 80% compliance)
  let currentStreak = 0;
  const sortedLogs = [...recentLogs].sort((a, b) => b.day.localeCompare(a.day));
  for (const log of sortedLogs) {
    if (log.dietCompliancePercent >= 80 && log.followedWorkout) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Total days tracked
  const allLogs = await db
    .select()
    .from(trackingLogsTable)
    .where(eq(trackingLogsTable.userId, userId));
  const totalDaysTracked = allLogs.length;

  // Weight trend
  const weightLogs = recentLogs.filter((l) => l.weight != null).sort((a, b) => a.day.localeCompare(b.day));
  let weightTrend: "gaining" | "losing" | "stable" | null = null;
  if (weightLogs.length >= 2) {
    const first = weightLogs[0]!.weight!;
    const last = weightLogs[weightLogs.length - 1]!.weight!;
    const diff = last - first;
    if (diff > 0.5) weightTrend = "gaining";
    else if (diff < -0.5) weightTrend = "losing";
    else weightTrend = "stable";
  }

  res.json({
    user,
    todayDietPlan: todayDietPlan ?? null,
    todayWorkoutPlan: todayWorkoutPlan ?? null,
    todayTracking: todayTracking ?? null,
    weeklyDietCompliance: Math.round(weeklyDietCompliance),
    weeklyWorkoutCompliance: Math.round(weeklyWorkoutCompliance),
    currentStreak,
    totalDaysTracked,
    weightTrend,
  });
});

router.get("/dashboard/:userId/progress", async (req, res): Promise<void> => {
  const params = GetUserProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rawDays = req.query.days;
  const days = rawDays ? parseInt(String(rawDays), 10) : 30;
  const startDate = getDateStr(days);

  const logs = await db
    .select()
    .from(trackingLogsTable)
    .where(and(eq(trackingLogsTable.userId, params.data.userId), gte(trackingLogsTable.day, startDate)))
    .orderBy(trackingLogsTable.day);

  // Join with diet plans to get calorie data
  const dietPlans = await db
    .select()
    .from(dietPlansTable)
    .where(and(eq(dietPlansTable.userId, params.data.userId), gte(dietPlansTable.day, startDate)));

  const dietPlansByDay = new Map(dietPlans.map((p) => [p.day, p]));

  const progress = logs.map((log) => ({
    day: log.day,
    weight: log.weight,
    dietCompliance: Math.round(log.dietCompliancePercent ?? 0),
    workoutFollowed: log.followedWorkout,
    totalCaloriesPlanned: dietPlansByDay.get(log.day)?.totalCalories ?? null,
  }));

  res.json(progress);
});

export default router;
