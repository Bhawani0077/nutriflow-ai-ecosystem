import React, { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Target, Trophy, Camera, MapPin, Activity } from "lucide-react";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const userId = parseInt(localStorage.getItem('userId') || '0');

  useEffect(() => {
    if (!userId) setLocation("/");
  }, [userId, setLocation]);

  const { data: summary, isLoading } = useGetDashboardSummary(userId, {
    query: { enabled: !!userId, queryKey: getGetDashboardSummaryQueryKey(userId) }
  });

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse">Loading your day...</div>;
  }

  if (!summary) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hi, {summary.user.name}</h1>
          <p className="text-muted-foreground text-sm">Let's crush your goals today.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {summary.currentStreak} <Flame className="w-4 h-4 ml-1" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/scanner">
          <Button variant="outline" className="h-20 w-full flex flex-col gap-2 shadow-sm">
            <Camera className="w-6 h-6 text-primary" />
            <span className="text-xs">Scan Food</span>
          </Button>
        </Link>
        <Link href="/nearby">
          <Button variant="outline" className="h-20 w-full flex flex-col gap-2 shadow-sm">
            <MapPin className="w-6 h-6 text-primary" />
            <span className="text-xs">Find Healthy</span>
          </Button>
        </Link>
      </div>

      {/* AI Note */}
      {summary.todayDietPlan?.notes && (
        <Card className="bg-secondary/50 border-none shadow-sm">
          <CardContent className="p-4 flex gap-4 items-start">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Coach Note</p>
              <p className="text-sm text-muted-foreground leading-snug">{summary.todayDietPlan.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Diet Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Today's Fuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.todayDietPlan ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold text-foreground">{summary.todayDietPlan.totalCalories}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">KCAL PLANNED</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/diet")}>View Plan</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">No plan generated for today yet.</p>
              <Button variant="outline" size="sm" onClick={() => setLocation("/diet")}>Generate Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Diet Compliance</p>
            <p className="text-2xl font-bold text-primary">{Math.round(summary.weeklyDietCompliance)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Workout Focus</p>
            <p className="text-2xl font-bold text-primary">{Math.round(summary.weeklyWorkoutCompliance)}%</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
