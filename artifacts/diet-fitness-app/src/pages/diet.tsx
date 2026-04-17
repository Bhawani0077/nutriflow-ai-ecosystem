import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetDietPlans, useGenerateDietPlan, getGetDietPlansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Zap, Beef, Wheat, Droplets, ChevronRight, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Meal = {
  name: string;
  time: string;
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  why: string;
};

export default function DietPlanView() {
  const [, setLocation] = useLocation();
  const userId = parseInt(localStorage.getItem("userId") || "0");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) setLocation("/");
  }, [userId, setLocation]);

  const { data: plans, isLoading } = useGetDietPlans(userId, undefined, {
    query: { enabled: !!userId, queryKey: getGetDietPlansQueryKey(userId) },
  });

  const generatePlan = useGenerateDietPlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDietPlansQueryKey(userId) });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Utensils className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold">No Diet Plan Yet</h2>
        <p className="text-muted-foreground text-sm">Generate your personalized AI diet plan to get started.</p>
        <Button
          onClick={() => generatePlan.mutate({ data: { userId } })}
          disabled={generatePlan.isPending}
          className="rounded-full px-8"
          data-testid="button-generate-diet"
        >
          {generatePlan.isPending ? "Generating with AI..." : "Generate My Plan"}
        </Button>
      </div>
    );
  }

  const selectedPlan = plans[selectedDayIndex];
  const meals = (selectedPlan?.meals ?? []) as Meal[];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border/50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-xl font-bold">Diet Plan</h1>
            <p className="text-sm text-muted-foreground">Your personalized meal guide</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generatePlan.mutate({ data: { userId } })}
            disabled={generatePlan.isPending}
            className="text-xs rounded-full"
            data-testid="button-generate-new-diet"
          >
            {generatePlan.isPending ? "..." : "Refresh Plan"}
          </Button>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {plans.map((plan, i) => {
            const dayLabel = i === 0 ? "Today" : i === 1 ? "Yesterday" : new Date(plan.day + "T00:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedDayIndex(i)}
                data-testid={`tab-day-${i}`}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedDayIndex === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground border border-border"
                }`}
              >
                {dayLabel}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPlan && (
        <motion.div
          key={selectedPlan.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 space-y-4"
        >
          {/* Adaptive note */}
          {selectedPlan.notes && (
            <div className="bg-accent/30 border border-accent/50 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-accent-foreground">{selectedPlan.notes}</p>
            </div>
          )}

          {/* Daily totals */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Calories", value: Math.round(selectedPlan.totalCalories), icon: Zap, unit: "kcal", color: "text-orange-500" },
              { label: "Protein", value: Math.round(meals.reduce((s, m) => s + m.protein, 0)), icon: Beef, unit: "g", color: "text-red-500" },
              { label: "Carbs", value: Math.round(meals.reduce((s, m) => s + m.carbs, 0)), icon: Wheat, unit: "g", color: "text-yellow-500" },
              { label: "Fats", value: Math.round(meals.reduce((s, m) => s + m.fats, 0)), icon: Droplets, unit: "g", color: "text-blue-500" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="p-2 text-center">
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <div className="text-sm font-bold">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">{stat.unit}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Meals */}
          <div className="space-y-3">
            {meals.map((meal) => (
              <Card
                key={meal.name}
                className="border-border/50 cursor-pointer"
                onClick={() => setExpandedMeal(expandedMeal === meal.name ? null : meal.name)}
                data-testid={`card-meal-${meal.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px] px-2">{meal.time}</Badge>
                        <span className="font-semibold text-sm">{meal.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{meal.items.join(", ")}</p>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-sm font-bold text-primary">{meal.calories} kcal</div>
                      <div className="flex gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <span>P: {meal.protein}g</span>
                        <span>C: {meal.carbs}g</span>
                        <span>F: {meal.fats}g</span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedMeal === meal.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/50"
                      >
                        <div className="flex items-start gap-2">
                          <Info className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground italic">{meal.why}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground absolute right-4 top-4 transition-transform ${expandedMeal === meal.name ? "rotate-90" : ""}`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
