import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetNearbyFood, getGetNearbyFoodQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Leaf, Beef as BeefIcon, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

type FoodItem = {
  id: number;
  shopName: string;
  foodName: string;
  price: number;
  distance: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  nutritionScore: number;
  isVeg: boolean;
  category: string;
};

export default function Nearby() {
  const [, setLocation] = useLocation();
  const userId = parseInt(localStorage.getItem("userId") || "0");
  const [budget, setBudget] = useState("250");
  const [preference, setPreference] = useState<"any" | "veg" | "non-veg">("any");
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) setLocation("/");
  }, [userId, setLocation]);

  const params = { budget: parseFloat(budget), preference };
  const { data: items, isLoading, refetch } = useGetNearbyFood(params, {
    query: {
      enabled: submitted,
      queryKey: getGetNearbyFoodQueryKey(params),
    },
  });

  const handleSearch = () => {
    setSubmitted(true);
    queryClient.invalidateQueries({ queryKey: getGetNearbyFoodQueryKey(params) });
    refetch();
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Nearby Food</h1>
          <p className="text-xs text-muted-foreground">Best value within your budget</p>
        </div>
      </div>

      {/* Filter */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Budget (Rs.)</label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="250"
                data-testid="input-budget"
                className="text-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="rounded-full gap-1"
              data-testid="button-search-food"
            >
              <Search className="w-4 h-4" />
              {isLoading ? "..." : "Find"}
            </Button>
          </div>

          {/* Preference filter */}
          <div className="flex gap-2">
            {(["any", "veg", "non-veg"] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => setPreference(pref)}
                data-testid={`filter-${pref}`}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  preference === pref
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border"
                }`}
              >
                {pref === "veg" && <Leaf className="w-3 h-3 inline mr-1" />}
                {pref === "non-veg" && <BeefIcon className="w-3 h-3 inline mr-1" />}
                {pref.charAt(0).toUpperCase() + pref.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl" />
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No food found within your budget and preference.</p>
          <p className="text-sm">Try increasing your budget or changing the filter.</p>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {items.length} options found — sorted by nutrition value
          </p>
          {(items as FoodItem[]).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-border/50" data-testid={`card-food-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{item.foodName}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${item.isVeg ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {item.isVeg ? "Veg" : "Non-veg"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.shopName} • {item.distance}</p>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-base font-bold text-primary">Rs. {item.price}</div>
                      <div className="flex items-center gap-1 text-xs text-amber-500 justify-end">
                        <TrendingUp className="w-3 h-3" />
                        <span>{item.nutritionScore.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span className="text-orange-500 font-medium">{Math.round(item.calories)} kcal</span>
                    <span>P: {Math.round(item.protein)}g</span>
                    <span>C: {Math.round(item.carbs)}g</span>
                    <span>F: {Math.round(item.fats)}g</span>
                  </div>

                  {/* Nutrition per rupee indicator */}
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(item.nutritionScore * 10, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Nutrition value for price</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!submitted && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Set your budget and search for nearby healthy food options.</p>
        </div>
      )}
    </div>
  );
}
