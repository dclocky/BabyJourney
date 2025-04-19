import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import PregnancyPage from "@/pages/pregnancy-page";
import BabyPage from "@/pages/baby-page";
import MilestonesPage from "@/pages/milestones-page";
import AppointmentsPage from "@/pages/appointments-page";
import MemoriesPage from "@/pages/memories-page";
import FamilyMembersPage from "@/pages/family-members-page";
import RegistryPage from "@/pages/registry-page";
import RegistrySharePage from "@/pages/registry-share-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/pregnancy" component={PregnancyPage} />
      <ProtectedRoute path="/baby" component={BabyPage} />
      <ProtectedRoute path="/milestones" component={MilestonesPage} />
      <ProtectedRoute path="/appointments" component={AppointmentsPage} />
      <ProtectedRoute path="/memories" component={MemoriesPage} />
      <ProtectedRoute path="/family" component={FamilyMembersPage} />
      <ProtectedRoute path="/registry" component={RegistryPage} />
      <ProtectedRoute path="/registry/:id" component={RegistryPage} />
      {/* Public shared registry view - doesn't require authentication */}
      <Route path="/registry/share/:shareCode" component={RegistrySharePage} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
