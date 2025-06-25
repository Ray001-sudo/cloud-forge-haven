
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Bot, Globe, Activity } from 'lucide-react';

interface DashboardStatsProps {
  totalProjects: number;
  runningProjects: number;
  stoppedProjects: number;
  totalDeployments: number;
  subscriptionTier: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalProjects,
  runningProjects,
  stoppedProjects,
  totalDeployments,
  subscriptionTier
}) => {
  const dashboardStats = [
    {
      title: 'Active Projects',
      value: totalProjects.toString(),
      description: totalProjects === 0 ? 'No projects yet' : `${runningProjects} running, ${stoppedProjects} stopped`,
      icon: Rocket,
      color: 'text-sky-400'
    },
    {
      title: 'Running Services',
      value: runningProjects.toString(),
      description: runningProjects === 0 ? 'No running services' : 'Services operational',
      icon: Bot,
      color: 'text-green-400'
    },
    {
      title: 'Total Deployments',
      value: totalDeployments.toString(),
      description: totalDeployments === 0 ? 'No deployments yet' : 'All time deployments',
      icon: Globe,
      color: 'text-purple-400'
    },
    {
      title: 'Account Status',
      value: subscriptionTier?.toUpperCase() || 'FREE',
      description: 'Current plan',
      icon: Activity,
      color: 'text-emerald-400'
    }
  ];

  return (
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
  );
};

export default DashboardStats;
