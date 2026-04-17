import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAnalyzeFood } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, Zap, Beef, Wheat, Droplets, Leaf, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  foodName: z.string().min(2, "Please enter a food name"),
  quantity: z.string().min(1, "Please specify the quantity"),
});

type ScanResult = {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  healthScore: number;
  suggestions: string[];
};

function HealthScoreMeter({ score }: { score: number }) {
  const color = score >= 8 ? "bg-green-500" : score >= 6 ? "bg-yellow-500" : score >= 4 ? "bg-orange-500" : "bg-red-500";
  const label = score >= 8 ? "Excellent" : score >= 6 ? "Good" : score >= 4 ? "Fair" : "Poor";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Health Score</span>
        <span className={`text-sm font-bold ${color.replace("bg-", "text-")}`}>{score.toFixed(1)}/10 — {label}</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function Scanner() {
  const [, setLocation] = useLocation();
  const userId = parseInt(localStorage.getItem("userId") || "0");
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (!userId) setLocation("/");
  }, [userId, setLocation]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { foodName: "", quantity: "" },
  });

  const analyzeFood = useAnalyzeFood({
    mutation: {
      onSuccess: (data) => {
        setResult(data as ScanResult);
        setScanHistory((prev) => [data as ScanResult, ...prev.slice(0, 4)]);
      },
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    analyzeFood.mutate({ data: values });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Camera className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Food Scanner</h1>
          <p className="text-xs text-muted-foreground">AI-powered nutrition analysis</p>
        </div>
      </div>

      {/* Input Form */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="foodName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Dal Makhani, Chicken Biryani..."
                        data-testid="input-food-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 1 bowl, 2 roti, 200g..."
                        data-testid="input-quantity"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={analyzeFood.isPending}
                className="w-full rounded-full gap-2"
                data-testid="button-analyze-food"
              >
                <Sparkles className="w-4 h-4" />
                {analyzeFood.isPending ? "Analyzing with AI..." : "Analyze Nutrition"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {result.foodName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Macros grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Calories", value: Math.round(result.calories), unit: "kcal", icon: Zap, color: "text-orange-500" },
                    { label: "Protein", value: Math.round(result.protein), unit: "g", icon: Beef, color: "text-red-500" },
                    { label: "Carbs", value: Math.round(result.carbs), unit: "g", icon: Wheat, color: "text-yellow-500" },
                    { label: "Fats", value: Math.round(result.fats), unit: "g", icon: Droplets, color: "text-blue-500" },
                    { label: "Fiber", value: Math.round(result.fiber), unit: "g", icon: Leaf, color: "text-green-500" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2 bg-card rounded-xl p-3">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <div>
                        <div className="text-sm font-bold">{stat.value}{stat.unit}</div>
                        <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Health score */}
                <HealthScoreMeter score={result.healthScore} />

                {/* Suggestions */}
                {result.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Improvement Tips
                    </p>
                    <ul className="space-y-1.5">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan History */}
      {scanHistory.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Recent Scans</h3>
          {scanHistory.slice(1).map((item, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{item.foodName}</p>
                  <p className="text-xs text-muted-foreground">P:{item.protein}g C:{item.carbs}g F:{item.fats}g</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{Math.round(item.calories)} kcal</p>
                  <Badge variant="secondary" className="text-[10px]">{item.healthScore.toFixed(1)}/10</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
