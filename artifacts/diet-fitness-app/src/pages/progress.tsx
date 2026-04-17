import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetUserProgress, useGetDashboardSummary, getGetUserProgressQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Award, Flame, Target } from "lucide-react";

export default function Progress() {
  const [, setLocation] = useLocation();
  const userId = parseInt(localStorage.getItem("userId") || "0");

  useEffect(() => {
    if (!userId) setLocation("/");
  }, [userId, setLocation]);

  const { data: progress, isLoading: progressLoading } = useGetUserProgress(userId, undefined, {
    query: { enabled: !!userId, queryKey: getGetUserProgressQueryKey(userId) },
  });

  const { data: summary } = useGetDashboardSummary(userId, {
    query: { enabled: !!userId, queryKey: getGetDashboardSummaryQueryKey(userId) },
  });

  if (progressLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted rounded-2xl" />
        ))}
      </div>
    );
  }

  const hasData = progress && progress.length > 0;

  const weightData = (progress ?? [])
    .filter((p) => p.weight != null)
    .map((p) => ({
      day: new Date(p.day + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
      weight: p.weight,
    }));

  const complianceData = (progress ?? []).slice(-14).map((p) => ({
    day: new Date(p.day + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
    diet: Math.round(p.dietCompliance),
    workout: p.workoutFollowed ? 100 : 0,
  }));

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Progress</h1>
          <p className="text-xs text-muted-foreground">Your health journey overview</p>
        </div>
      </div>

      {/* Stats row */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Current Streak",
              value: `${summary.currentStreak} days`,
              icon: Flame,
              color: "text-orange-500",
              bg: "bg-orange-50",
            },
            {
              label: "Total Days",
              value: `${summary.totalDaysTracked} logged`,
              icon: Award,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Diet Compliance",
              value: `${Math.round(summary.weeklyDietCompliance)}%`,
              icon: Target,
              color: "text-green-500",
              bg: "bg-green-50",
            },
            {
              label: "Workout Rate",
              value: `${Math.round(summary.weeklyWorkoutCompliance)}%`,
              icon: TrendingUp,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className={`p-3 ${stat.bg} rounded-xl`}>
                <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} />
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!hasData ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No progress data yet.</p>
          <p className="text-sm">Start tracking your daily meals and workouts to see your progress here.</p>
        </div>
      ) : (
        <>
          {/* Weight chart */}
          {weightData.length > 1 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Weight Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={weightData}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 10 }}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v) => [`${v} kg`, "Weight"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {summary?.weightTrend && (
                  <Badge
                    variant="secondary"
                    className={`mt-2 text-xs ${summary.weightTrend === "losing" ? "bg-green-100 text-green-700" : summary.weightTrend === "gaining" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    Trend: {summary.weightTrend}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compliance bar chart */}
          {complianceData.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Diet & Workout Compliance (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={complianceData} barGap={2}>
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} width={25} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v, n) => [`${v}%`, n === "diet" ? "Diet" : "Workout"]}
                    />
                    <Bar dataKey="diet" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Diet" barSize={12} />
                    <Bar dataKey="workout" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} name="Workout" barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary" />
                    Diet compliance
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-accent" />
                    Workout done
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent streak */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Day-by-Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(progress ?? []).slice(-30).map((p) => {
                  const isGood = p.dietCompliance >= 80 && p.workoutFollowed;
                  const isOk = p.dietCompliance >= 50;
                  return (
                    <div
                      key={p.day}
                      title={`${p.day}: ${Math.round(p.dietCompliance)}% diet${p.workoutFollowed ? ", workout done" : ""}`}
                      className={`w-8 h-8 rounded-md text-[10px] flex items-center justify-center font-medium ${
                        isGood
                          ? "bg-green-500 text-white"
                          : isOk
                          ? "bg-yellow-400 text-white"
                          : "bg-red-300 text-white"
                      }`}
                      data-testid={`day-dot-${p.day}`}
                    >
                      {new Date(p.day + "T00:00:00").getDate()}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Green = full compliance, Yellow = partial, Red = missed
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
