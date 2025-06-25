
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Deployments from "./pages/Deployments";
import Bots from "./pages/Bots";
import Files from "./pages/Files";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Webhooks from "./pages/Webhooks";
import CronJobs from "./pages/CronJobs";
import Monitoring from "./pages/Monitoring";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/projects" element={<Projects />} />
            <Route path="/dashboard/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/dashboard/projects/:projectId/deployments" element={<Deployments />} />
            <Route path="/dashboard/projects/:projectId/bots" element={<Bots />} />
            <Route path="/dashboard/projects/:projectId/files" element={<Files />} />
            <Route path="/dashboard/projects/:projectId/logs" element={<Logs />} />
            <Route path="/dashboard/projects/:projectId/settings" element={<Settings />} />
            <Route path="/dashboard/billing" element={<Billing />} />
            <Route path="/dashboard/webhooks" element={<Webhooks />} />
            <Route path="/dashboard/cron" element={<CronJobs />} />
            <Route path="/dashboard/monitoring" element={<Monitoring />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
