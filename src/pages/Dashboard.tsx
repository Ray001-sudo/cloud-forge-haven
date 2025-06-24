
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  Bot,
  Monitor,
  Activity,
  Cpu,
  HardDrive,
  Plus,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react';
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

  const dashboardStats = [
    {
      title: 'Active Projects',
      value: stats.totalProjects.toString(),
      description: stats.totalProjects === 0 ? 'No projects yet' : `${stats.runningProjects} running, ${stats.stoppedProjects} stopped`,
      icon: Rocket,
      color: 'text-sky-400'
    },
    {
      title: 'Running Services',
      value: stats.runningProjects.toString(),
      description: stats.runningProjects === 0 ? 'No running services' : 'Services operational',
      icon: Bot,
      color: 'text-green-400'
    },
    {
      title: 'Total Deployments',
      value: stats.totalDeployments.toString(),
      description: stats.totalDeployments === 0 ? 'No deployments yet' : 'All time deployments',
      icon: Globe,
      color: 'text-purple-400'
    },
    {
      title: 'Account Status',
      value: profile?.subscription_tier?.toUpperCase() || 'FREE',
      description: 'Current plan',
      icon: Activity,
      color: 'text-emerald-400'
    }
  ];

  const planLimits = {
    free: { projects: 1, ram: 256, cpu: 25 },
    pro: { projects: 10, ram: 1024, cpu: 75 },
    elite: { projects: 50, ram: 4096, cpu: 100 }
  };

  const currentLimits = planLimits[profile?.subscription_tier as keyof typeof planLimits] || planLimits.free;

  const handleCreateProject = () => {
    navigate('/dashboard/projects');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {profile?.username || 'User'}!
            </h1>
            <p className="text-slate-400 mt-1">
              Manage your cloud applications and deployments
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={`${
              profile?.subscription_tier === 'pro' ? 'bg-sky-600' :
              profile?.subscription_tier === 'elite' ? 'bg-purple-600' :
              'bg-slate-600'
            } text-white`}>
              {profile?.subscription_tier?.toUpperCase()} PLAN
            </Badge>
            <Button onClick={handleCreateProject} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat) => (
            <Card key={stat.title} className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plan Usage & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Usage */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Resource Usage</CardTitle>
              <CardDescription className="text-slate-400">
                Current usage against your plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Projects</span>
                  <span className="text-slate-300">{stats.totalProjects} / {currentLimits.projects}</span>
                </div>
                <Progress 
                  value={Math.min((stats.totalProjects / currentLimits.projects) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">RAM Usage</span>
                  <span className="text-slate-300">{stats.runningProjects * 128} MB / {currentLimits.ram} MB</span>
                </div>
                <Progress 
                  value={Math.min(((stats.runningProjects * 128) / currentLimits.ram) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Active Services</span>
                  <span className="text-slate-300">{stats.runningProjects} running</span>
                </div>
                <Progress 
                  value={stats.runningProjects > 0 ? Math.min((stats.runningProjects / currentLimits.projects) * 100, 100) : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-slate-400">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={handleCreateProject}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Deploy New App
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={handleCreateProject}
              >
                <Bot className="mr-2 h-4 w-4" />
                Create Bot
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => navigate('/dashboard/monitoring')}
              >
                <Monitor className="mr-2 h-4 w-4" />
                View Monitoring
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => navigate('/dashboard/cron')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Schedule Cron Job
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Latest deployments and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Activity Yet</h3>
                <p className="text-slate-400 mb-4">
                  Create your first project to see deployment activity here
                </p>
                <Button onClick={handleCreateProject} className="bg-sky-600 hover:bg-sky-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <p className="text-sm text-white">
                          {activity.action} <span className="text-sky-400">{activity.project}</span>
                        </p>
                        <p className="text-xs text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                    <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
