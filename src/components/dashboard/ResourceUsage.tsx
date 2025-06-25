
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ResourceUsageProps {
  totalProjects: number;
  runningProjects: number;
  subscriptionTier: string;
}

interface PlanLimits {
  projects: number;
  ram: number;
  cpu: number;
}

const ResourceUsage: React.FC<ResourceUsageProps> = ({
  totalProjects,
  runningProjects,
  subscriptionTier
}) => {
  const planLimits: Record<string, PlanLimits> = {
    free: { projects: 1, ram: 256, cpu: 25 },
    pro: { projects: 10, ram: 1024, cpu: 75 },
    elite: { projects: 50, ram: 4096, cpu: 100 }
  };

  const currentLimits = planLimits[subscriptionTier as keyof typeof planLimits] || planLimits.free;

  return (
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
            <span className="text-slate-300">{totalProjects} / {currentLimits.projects}</span>
          </div>
          <Progress 
            value={Math.min((totalProjects / currentLimits.projects) * 100, 100)} 
            className="h-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">RAM Usage</span>
            <span className="text-slate-300">{runningProjects * 128} MB / {currentLimits.ram} MB</span>
          </div>
          <Progress 
            value={Math.min(((runningProjects * 128) / currentLimits.ram) * 100, 100)} 
            className="h-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Active Services</span>
            <span className="text-slate-300">{runningProjects} running</span>
          </div>
          <Progress 
            value={runningProjects > 0 ? Math.min((runningProjects / currentLimits.projects) * 100, 100) : 0} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceUsage;
