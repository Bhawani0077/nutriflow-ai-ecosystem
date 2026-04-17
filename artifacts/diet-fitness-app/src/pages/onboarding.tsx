import React from "react";
import { useLocation } from "wouter";
import { useCreateUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUserBodyDietPreference, CreateUserBodyActivityType, CreateUserBodyGoal } from "@workspace/api-client-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const createUser = useCreateUser();
  const [formData, setFormData] = React.useState({
    name: "",
    age: 25,
    height: 170,
    weight: 70,
    dietPreference: CreateUserBodyDietPreference.veg,
    activityType: CreateUserBodyActivityType.sedentary,
    goal: CreateUserBodyGoal["weight-loss"],
    goalTimelineWeeks: 12
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { data: formData },
      {
        onSuccess: (user) => {
          localStorage.setItem("userId", user.id.toString());
          setLocation("/dashboard");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-2xl">
            AI
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Meet Your Coach</CardTitle>
          <CardDescription>Let's build a personalized plan for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input required placeholder="How should I call you?" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" required value={formData.age} onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" required value={formData.height} onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" required value={formData.weight} onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Diet Preference</Label>
              <Select value={formData.dietPreference} onValueChange={(val: any) => setFormData({...formData, dietPreference: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select value={formData.activityType} onValueChange={(val: any) => setFormData({...formData, activityType: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="home">Home Workouts</SelectItem>
                  <SelectItem value="gym">Gym</SelectItem>
                  <SelectItem value="outdoor">Outdoor/Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Goal</Label>
              <Select value={formData.goal} onValueChange={(val: any) => setFormData({...formData, goal: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight-loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="weight-gain">Weight Gain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={createUser.isPending}>
              {createUser.isPending ? "Creating..." : "Start My Journey"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
