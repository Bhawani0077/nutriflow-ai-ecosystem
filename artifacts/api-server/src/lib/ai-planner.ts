import { openai } from "@workspace/integrations-openai-ai-server";
import type { User } from "@workspace/db";
import type { Meal } from "@workspace/db";
import type { Exercise } from "@workspace/db";

export function calculateBMR(user: User): number {
  // Mifflin-St Jeor formula
  const base = 10 * user.weight + 6.25 * user.height - 5 * user.age;
  // Assume male as default, can be extended
  return base + 5;
}

export function getActivityMultiplier(activityType: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    home: 1.375,
    outdoor: 1.55,
    gym: 1.725,
  };
  return multipliers[activityType] ?? 1.375;
}

export function calculateTargetCalories(user: User, bmr: number): number {
  const tdee = bmr * getActivityMultiplier(user.activityType);
  const goalAdjustments: Record<string, number> = {
    "weight-loss": -500,
    "weight-gain": 500,
    maintenance: 0,
    "muscle-gain": 250,
  };
  return Math.round(tdee + (goalAdjustments[user.goal] ?? 0));
}

export async function generateDietPlanWithAI(
  user: User,
  targetCalories: number,
  adaptiveNotes?: string
): Promise<{ meals: Meal[]; notes: string | null }> {
  const prompt = `You are a professional nutritionist and dietitian. Generate a personalized daily diet plan for the following user:

Name: ${user.name}
Age: ${user.age} years
Height: ${user.height} cm
Weight: ${user.weight} kg
Diet Preference: ${user.dietPreference}
Activity Type: ${user.activityType}
Goal: ${user.goal}
Target Daily Calories: ${targetCalories} kcal

${adaptiveNotes ? `Adaptive context from yesterday: ${adaptiveNotes}` : ""}

Generate EXACTLY 4 meals: Breakfast, Mid-Morning Snack, Lunch, Dinner.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation outside the JSON.

Return this exact JSON structure:
{
  "meals": [
    {
      "name": "Breakfast",
      "time": "7:00 AM",
      "items": ["item1", "item2"],
      "calories": 450,
      "protein": 20,
      "carbs": 60,
      "fats": 12,
      "why": "Explanation of why this meal at this time and what benefit it provides"
    }
  ],
  "notes": "Any adaptive note like 'You skipped protein yesterday, added more today' or null"
}

Make the meals culturally appropriate and realistic. Use Indian food items if diet preference matches.
Each meal's "why" must explain the science/benefit clearly.
Total calories must sum close to ${targetCalories} kcal.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: "You are an expert nutritionist. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      meals: parsed.meals ?? [],
      notes: parsed.notes ?? null,
    };
  } catch {
    throw new Error("Failed to parse AI diet plan response");
  }
}

export async function generateWorkoutPlanWithAI(
  user: User,
  dayOfWeek: number
): Promise<{ type: string; exercises: Exercise[]; estimatedDuration: number; notes: string | null }> {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const day = dayNames[dayOfWeek] ?? "Monday";

  const prompt = `You are a professional personal trainer. Generate a personalized workout plan for:

Name: ${user.name}
Goal: ${user.goal}
Activity Type: ${user.activityType}
Day: ${day}

Generate an appropriate workout for this day. For gym users, use gym equipment. For home users, use bodyweight.
Include rest days strategically (Sunday typically, or after 2-3 intense days).

IMPORTANT: Return ONLY valid JSON.

Return this exact JSON structure:
{
  "type": "strength|cardio|hiit|rest|flexibility",
  "estimatedDuration": 45,
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": 12,
      "duration": null,
      "muscleGroup": "Chest",
      "why": "Why this exercise at this stage of the plan and what muscle it targets"
    }
  ],
  "notes": "Any motivational or adaptive note or null"
}

For rest days, exercises array can be empty or have light stretches.
For cardio, use duration (e.g. "30 minutes") instead of sets/reps (set them null).`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: "You are an expert personal trainer. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      type: parsed.type ?? "strength",
      exercises: parsed.exercises ?? [],
      estimatedDuration: parsed.estimatedDuration ?? 45,
      notes: parsed.notes ?? null,
    };
  } catch {
    throw new Error("Failed to parse AI workout plan response");
  }
}

export async function analyzeFoodWithAI(
  foodName: string,
  quantity: string,
  imageDescription?: string | null
): Promise<{
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  healthScore: number;
  suggestions: string[];
}> {
  const prompt = `Analyze the nutritional content of this food:

Food: ${foodName}
Quantity: ${quantity}
${imageDescription ? `Additional context: ${imageDescription}` : ""}

IMPORTANT: Return ONLY valid JSON.

Return this exact JSON structure:
{
  "foodName": "Cleaned food name",
  "calories": 350,
  "protein": 15,
  "carbs": 45,
  "fats": 8,
  "fiber": 3,
  "healthScore": 7.5,
  "suggestions": [
    "Add a side salad to increase fiber and micronutrients",
    "Reduce oil/butter to cut down on saturated fats"
  ]
}

healthScore is 0-10 (10 = perfectly healthy, 0 = very unhealthy).
Provide 2-4 practical, specific improvement suggestions.
All nutritional values should be realistic per the given quantity.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: "You are a nutrition expert. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Failed to parse AI food analysis response");
  }
}

export async function generateAdaptiveNote(
  user: User,
  missedMeals: string[],
  missedWorkout: boolean
): Promise<string> {
  if (missedMeals.length === 0 && !missedWorkout) {
    return "Great consistency yesterday! Keeping your plan optimized for today.";
  }

  const prompt = `A user with goal "${user.goal}" had these compliance issues yesterday:
${missedMeals.length > 0 ? `Missed meals: ${missedMeals.join(", ")}` : "All meals followed"}
${missedWorkout ? "Missed workout" : "Workout completed"}

Write a SHORT (1-2 sentences) adaptive note explaining what was adjusted today and why. Be encouraging but specific.
Example: "You skipped dinner protein yesterday → added extra protein to today's breakfast and lunch for recovery."`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim() ?? "Adapting your plan based on yesterday's progress.";
}
