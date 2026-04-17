import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Utensils, 
  Dumbbell, 
  Camera, 
  MapPin, 
  CheckSquare, 
  LineChart 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/diet", icon: Utensils, label: "Diet" },
  { href: "/workout", icon: Dumbbell, label: "Workout" },
  { href: "/scanner", icon: Camera, label: "Scan" },
  { href: "/nearby", icon: MapPin, label: "Nearby" },
  { href: "/tracking", icon: CheckSquare, label: "Track" },
  { href: "/progress", icon: LineChart, label: "Progress" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-background border-x border-border/50 shadow-2xl relative overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      
      <nav className="fixed bottom-0 w-full max-w-md bg-card border-t border-border z-50 pb-safe px-2 py-2 flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
