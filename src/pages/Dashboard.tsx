
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

const Dashboard = () => {
  const { profile } = useAuth();

  const stats = [
    {
      title: 'Active Projects',
      value: '3',
      description: '+1 from last month',
      icon: Rocket,
      color: 'text-sky-400'
    },
    {
      title: 'Running Bots',
      value: '2',
      description: 'All systems operational',
      icon: Bot,
      color: 'text-green-400'
    },
    {
      title: 'Total Deployments',
      value: '15',
      description: '+5 this week',
      icon: Globe,
      color: 'text-purple-400'
    },
    {
      title: 'Uptime',
      value: '99.9%',
      description: 'Last 30 days',
      icon: Activity,
      color: 'text-emerald-400'
    }
  ];

  const planLimits = {
    free: { projects: 1, ram: 256, cpu: 25 },
    pro: { projects: 10, ram: 1024, cpu: 75 },
    elite: { projects: 50, ram: 4096, cpu: 100 }
  };

  const currentLimits = planLimits[profile?.plan_tier as keyof typeof planLimits] || planLimits.free;

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
              profile?.plan_tier === 'pro' ? 'bg-sky-600' :
              profile?.plan_tier === 'elite' ? 'bg-purple-600' :
              'bg-slate-600'
            } text-white`}>
              {profile?.plan_tier?.toUpperCase()} PLAN
            </Badge>
            <Button className="bg-sky-600 hover:bg-sky-700">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
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
                  <span className="text-slate-300">3 / {currentLimits.projects}</span>
                </div>
                <Progress 
                  value={(3 / currentLimits.projects) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">RAM Usage</span>
                  <span className="text-slate-300">512 MB / {currentLimits.ram} MB</span>
                </div>
                <Progress 
                  value={(512 / currentLimits.ram) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">CPU Usage</span>
                  <span className="text-slate-300">45% / {currentLimits.cpu}%</span>
                </div>
                <Progress 
                  value={45} 
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
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                <Rocket className="mr-2 h-4 w-4" />
                Deploy New App
              </Button>
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                <Bot className="mr-2 h-4 w-4" />
                Create Bot
              </Button>
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                <Monitor className="mr-2 h-4 w-4" />
                View Monitoring
              </Button>
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
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
            <div className="space-y-4">
              {[
                { action: 'Deployed', project: 'my-web-app', time: '2 minutes ago', status: 'success' },
                { action: 'Restarted', project: 'telegram-bot', time: '1 hour ago', status: 'success' },
                { action: 'Updated', project: 'api-service', time: '3 hours ago', status: 'success' },
                { action: 'Failed', project: 'worker-app', time: '5 hours ago', status: 'error' }
              ].map((activity, index) => (
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
