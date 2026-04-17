import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import DietPlanView from "@/pages/diet";
import WorkoutPlanView from "@/pages/workout";
import Scanner from "@/pages/scanner";
import Nearby from "@/pages/nearby";
import Tracking from "@/pages/tracking";
import Progress from "@/pages/progress";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/diet">
        <Layout><DietPlanView /></Layout>
      </Route>
      <Route path="/workout">
        <Layout><WorkoutPlanView /></Layout>
      </Route>
      <Route path="/scanner">
        <Layout><Scanner /></Layout>
      </Route>
      <Route path="/nearby">
        <Layout><Nearby /></Layout>
      </Route>
      <Route path="/tracking">
        <Layout><Tracking /></Layout>
      </Route>
      <Route path="/progress">
        <Layout><Progress /></Layout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
