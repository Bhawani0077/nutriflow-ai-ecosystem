import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { CreateUserBody, UpdateUserBody, GetUserParams } from "@workspace/api-zod";
import { calculateBMR, calculateTargetCalories } from "../lib/ai-planner";

const router: IRouter = Router();

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const fakeBMR = calculateBMR({
    ...data,
    id: 0,
    bmr: null,
    targetCalories: null,
    goalTimelineWeeks: data.goalTimelineWeeks ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const targetCalories = calculateTargetCalories({
    ...data,
    id: 0,
    bmr: fakeBMR,
    targetCalories: null,
    goalTimelineWeeks: data.goalTimelineWeeks ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }, fakeBMR);

  const [user] = await db
    .insert(usersTable)
    .values({
      ...data,
      goalTimelineWeeks: data.goalTimelineWeeks ?? null,
      bmr: fakeBMR,
      targetCalories,
    })
    .returning();

  res.status(201).json(user);
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const merged = { ...existing[0], ...updateData };
  const newBMR = calculateBMR(merged as typeof existing[0]);
  const newTargetCal = calculateTargetCalories(merged as typeof existing[0], newBMR);

  const [updated] = await db
    .update(usersTable)
    .set({ ...updateData, bmr: newBMR, targetCalories: newTargetCal })
    .where(eq(usersTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
