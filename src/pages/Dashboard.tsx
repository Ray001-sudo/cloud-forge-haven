
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ResourceUsage from '@/components/dashboard/ResourceUsage';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProjectStats {
  totalProjects: number;
  runningProjects: number;
  stoppedProjects: number;
  totalDeployments: number;
  recentActivity: Array<{
    action: string;
    project: string;
    time: string;
    status: 'success' | 'error';
  }>;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    runningProjects: 0,
    stoppedProjects: 0,
    totalDeployments: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects data
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile?.user_id);

      if (projectsError) throw projectsError;

      // Fetch deployments data
      const { data: deployments, error: deploymentsError } = await supabase
        .from('deployments')
        .select('*, projects!inner(*)')
        .eq('projects.user_id', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (deploymentsError) throw deploymentsError;

      // Calculate stats
      const totalProjects = projects?.length || 0;
      const runningProjects = projects?.filter(p => p.container_status === 'running').length || 0;
      const stoppedProjects = projects?.filter(p => p.container_status === 'stopped').length || 0;
      const totalDeployments = deployments?.length || 0;

      // Create recent activity from deployments
      const recentActivity = deployments?.slice(0, 4).map(deployment => ({
        action: deployment.status === 'success' ? 'Deployed' : 'Failed',
        project: deployment.project_id,
        time: new Date(deployment.created_at).toLocaleDateString(),
        status: deployment.status === 'success' ? 'success' as const : 'error' as const
      })) || [];

      setStats({
        totalProjects,
        runningProjects,
        stoppedProjects,
        totalDeployments,
        recentActivity
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/dashboard/projects');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader
          username={profile?.username || 'User'}
          subscriptionTier={profile?.subscription_tier || 'free'}
          onCreateProject={handleCreateProject}
        />

        <DashboardStats
          totalProjects={stats.totalProjects}
          runningProjects={stats.runningProjects}
          stoppedProjects={stats.stoppedProjects}
          totalDeployments={stats.totalDeployments}
          subscriptionTier={profile?.subscription_tier || 'free'}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResourceUsage
            totalProjects={stats.totalProjects}
            runningProjects={stats.runningProjects}
            subscriptionTier={profile?.subscription_tier || 'free'}
          />
          <QuickActions />
        </div>

        <RecentActivity
          activities={stats.recentActivity}
          onCreateProject={handleCreateProject}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
