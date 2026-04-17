import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetWorkoutPlans, useGenerateWorkoutPlan, getGetWorkoutPlansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Clock, Target, Info, ChevronRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Exercise = {
  name: string;
  sets: number | null;
  reps: number | null;
  duration: string | null;
  muscleGroup: string;
  why: string;
};

const workoutTypeColors: Record<string, string> = {
  strength: "bg-red-100 text-red-700",
  cardio: "bg-blue-100 text-blue-700",
  hiit: "bg-orange-100 text-orange-700",
  rest: "bg-green-100 text-green-700",
  flexibility: "bg-purple-100 text-purple-700",
};

export default function WorkoutPlanView() {
  const [, setLocation] = useLocation();
  const userId = parseInt(localStorage.getItem("userId") || "0");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) setLocation("/");
  }, [userId, setLocation]);

  const { data: plans, isLoading } = useGetWorkoutPlans(userId, undefined, {
    query: { enabled: !!userId, queryKey: getGetWorkoutPlansQueryKey(userId) },
  });

  const generatePlan = useGenerateWorkoutPlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWorkoutPlansQueryKey(userId) });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Dumbbell className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold">No Workout Plan Yet</h2>
        <p className="text-muted-foreground text-sm">Generate your AI-powered workout plan tailored to your goals.</p>
        <Button
          onClick={() => generatePlan.mutate({ data: { userId } })}
          disabled={generatePlan.isPending}
          className="rounded-full px-8"
          data-testid="button-generate-workout"
        >
          {generatePlan.isPending ? "Generating..." : "Generate My Workout"}
        </Button>
      </div>
    );
  }

  const selectedPlan = plans[selectedDayIndex];
  const exercises = (selectedPlan?.exercises ?? []) as Exercise[];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border/50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-xl font-bold">Workout Plan</h1>
            <p className="text-sm text-muted-foreground">Your personalized training</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generatePlan.mutate({ data: { userId } })}
            disabled={generatePlan.isPending}
            className="text-xs rounded-full gap-1"
            data-testid="button-refresh-workout"
          >
            <RefreshCw className="w-3 h-3" />
            {generatePlan.isPending ? "..." : "New Plan"}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {plans.map((plan, i) => {
            const dayLabel = i === 0 ? "Today" : i === 1 ? "Yesterday" : new Date(plan.day + "T00:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedDayIndex(i)}
                data-testid={`tab-workout-day-${i}`}
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
          {/* Plan summary */}
          <div className="flex items-center gap-3">
            <Badge className={`${workoutTypeColors[selectedPlan.type] ?? ""} capitalize text-xs`}>
              {selectedPlan.type}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{selectedPlan.estimatedDuration} min</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>{exercises.length} exercises</span>
            </div>
          </div>

          {selectedPlan.notes && (
            <div className="bg-accent/30 border border-accent/50 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-accent-foreground">{selectedPlan.notes}</p>
            </div>
          )}

          {selectedPlan.type === "rest" && exercises.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">Rest Day</div>
              <p className="text-muted-foreground text-sm">Your body grows stronger on rest days. Stay hydrated and sleep well.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise, idx) => (
                <Card
                  key={exercise.name}
                  className="border-border/50 cursor-pointer relative"
                  onClick={() => setExpandedExercise(expandedExercise === exercise.name ? null : exercise.name)}
                  data-testid={`card-exercise-${idx}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                          </div>
                          <div className="text-right text-xs font-medium text-primary">
                            {exercise.duration ? (
                              <span>{exercise.duration}</span>
                            ) : (
                              <span>{exercise.sets} sets × {exercise.reps} reps</span>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedExercise === exercise.name && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 pt-2 border-t border-border/50"
                            >
                              <div className="flex items-start gap-2">
                                <Info className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-muted-foreground italic">{exercise.why}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedExercise === exercise.name ? "rotate-90" : ""}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
