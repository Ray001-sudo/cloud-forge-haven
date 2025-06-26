
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Deployments from "./pages/Deployments";
import Logs from "./pages/Logs";
import Monitoring from "./pages/Monitoring";
import CronJobs from "./pages/CronJobs";
import Webhooks from "./pages/Webhooks";
import Settings from "./pages/Settings";
import Files from "./pages/Files";
import Terminal from "./pages/Terminal";
import Bots from "./pages/Bots";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/projects" element={<Projects />} />
            <Route path="/dashboard/billing" element={<Billing />} />
            <Route path="/project/:projectId" element={<ProjectDetail />} />
            <Route path="/project/:projectId/deployments" element={<Deployments />} />
            <Route path="/project/:projectId/logs" element={<Logs />} />
            <Route path="/project/:projectId/monitoring" element={<Monitoring />} />
            <Route path="/project/:projectId/cron-jobs" element={<CronJobs />} />
            <Route path="/project/:projectId/webhooks" element={<Webhooks />} />
            <Route path="/project/:projectId/bots" element={<Bots />} />
            <Route path="/project/:projectId/files" element={<Files />} />
            <Route path="/project/:projectId/terminal" element={<Terminal />} />
            <Route path="/project/:projectId/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
