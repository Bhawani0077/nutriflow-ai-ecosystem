import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useGetTodayDietPlan,
  useGetTodayWorkoutPlan,
  useGetTodayTracking,
  useGetUserTracking,
  useLogDailyTracking,
  getGetTodayTrackingQueryKey,
  getGetUserTrackingQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Scale, Dumbbell, Utensils, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

type Meal = { name: string; time: string };

export default function Tracking() {
  const [, setLocation] = useLocation();
  const userId = parseInt(localStorage.getItem("userId") || "0");
  const [followedMeals, setFollowedMeals] = useState<string[]>([]);
  const [followedWorkout, setFollowedWorkout] = useState(false);
  const [weight, setWeight] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) setLocation("/");
  }, [userId, setLocation]);

  const { data: todayDiet } = useGetTodayDietPlan(userId, {
    query: { enabled: !!userId, queryKey: ["/diet/plans", userId, "today"] },
  });

  const { data: todayWorkout } = useGetTodayWorkoutPlan(userId, {
    query: { enabled: !!userId, queryKey: ["/workout/plans", userId, "today"] },
  });

  const { data: todayTracking } = useGetTodayTracking(userId, {
    query: { enabled: !!userId, queryKey: getGetTodayTrackingQueryKey(userId) },
  });

  const { data: recentLogs } = useGetUserTracking(userId, undefined, {
    query: { enabled: !!userId, queryKey: getGetUserTrackingQueryKey(userId) },
  });

  // Pre-fill if today's tracking exists
  useEffect(() => {
    if (todayTracking) {
      setFollowedMeals(todayTracking.followedMeals as string[]);
      setFollowedWorkout(todayTracking.followedWorkout);
      if (todayTracking.weight) setWeight(String(todayTracking.weight));
      setSubmitted(true);
    }
  }, [todayTracking]);

  const logTracking = useLogDailyTracking({
    mutation: {
      onSuccess: () => {
        setSubmitted(true);
        queryClient.invalidateQueries({ queryKey: getGetTodayTrackingQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getGetUserTrackingQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(userId) });
      },
    },
  });

  const meals = ((todayDiet?.meals ?? []) as Meal[]);

  const toggleMeal = (mealName: string) => {
    setFollowedMeals((prev) =>
      prev.includes(mealName) ? prev.filter((m) => m !== mealName) : [...prev, mealName]
    );
  };

  const handleSubmit = () => {
    logTracking.mutate({
      data: {
        userId,
        dietPlanId: todayDiet?.id ?? null,
        workoutPlanId: todayWorkout?.id ?? null,
        followedMeals,
        followedWorkout,
        weight: weight ? parseFloat(weight) : null,
        notes: null,
      },
    });
  };

  const compliancePercent = meals.length > 0 ? Math.round((followedMeals.length / meals.length) * 100) : 0;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Daily Tracking</h1>
          <p className="text-xs text-muted-foreground">Log what you followed today</p>
        </div>
      </div>

      {submitted && todayTracking && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700 font-medium">Today's tracking logged — {Math.round(todayTracking.dietCompliancePercent)}% diet compliance</p>
        </div>
      )}

      {/* Meals checklist */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Utensils className="w-4 h-4 text-primary" />
            Meals Today
            {meals.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {followedMeals.length}/{meals.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {meals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No diet plan for today. Generate one first.</p>
          ) : (
            meals.map((meal) => (
              <div
                key={meal.name}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 cursor-pointer hover:bg-accent/20 transition-colors"
                onClick={() => !submitted && toggleMeal(meal.name)}
                data-testid={`checkbox-meal-${meal.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Checkbox
                  checked={followedMeals.includes(meal.name)}
                  onCheckedChange={() => !submitted && toggleMeal(meal.name)}
                  disabled={submitted}
                  id={`meal-${meal.name}`}
                />
                <div className="flex-1">
                  <Label htmlFor={`meal-${meal.name}`} className="text-sm font-medium cursor-pointer">
                    {meal.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">{meal.time}</p>
                </div>
                {followedMeals.includes(meal.name) ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))
          )}

          {meals.length > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Compliance</span>
                <span className="font-medium text-primary">{compliancePercent}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${compliancePercent}%` }}
                  className="h-full bg-primary rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workout check */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => !submitted && setFollowedWorkout(!followedWorkout)}
            data-testid="checkbox-workout"
          >
            <Checkbox
              checked={followedWorkout}
              onCheckedChange={() => !submitted && setFollowedWorkout(!followedWorkout)}
              disabled={submitted}
              id="workout-check"
            />
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <Label htmlFor="workout-check" className="text-sm font-medium cursor-pointer">
                Completed Today's Workout
              </Label>
            </div>
            {todayWorkout && (
              <Badge variant="secondary" className="ml-auto text-xs capitalize">{todayWorkout.type}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weight log */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Current Weight (kg)</Label>
              <p className="text-xs text-muted-foreground">Optional — helps track progress</p>
            </div>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70.5"
              disabled={submitted}
              className="w-24 text-sm"
              data-testid="input-weight"
            />
          </div>
        </CardContent>
      </Card>

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={logTracking.isPending}
          className="w-full rounded-full"
          data-testid="button-log-tracking"
        >
          {logTracking.isPending ? "Saving..." : "Log Today's Progress"}
        </Button>
      )}

      {/* Recent history */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Recent Tracking</h3>
          {recentLogs.slice(0, 7).map((log) => (
            <Card key={log.id} className="border-border/50" data-testid={`card-log-${log.id}`}>
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{log.day}</p>
                  <p className="text-xs text-muted-foreground">
                    {(log.followedMeals as string[]).length} meals followed
                    {log.weight ? ` • ${log.weight}kg` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${log.dietCompliancePercent >= 80 ? "text-green-500" : log.dietCompliancePercent >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                    {Math.round(log.dietCompliancePercent)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">{log.followedWorkout ? "Workout done" : "No workout"}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
