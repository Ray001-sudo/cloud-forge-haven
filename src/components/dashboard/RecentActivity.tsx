
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Plus } from 'lucide-react';

interface ActivityItem {
  action: string;
  project: string;
  time: string;
  status: 'success' | 'error';
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onCreateProject: () => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  onCreateProject
}) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
        <CardDescription className="text-slate-400">
          Latest deployments and system events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Activity Yet</h3>
            <p className="text-slate-400 mb-4">
              Create your first project to see deployment activity here
            </p>
            <Button onClick={onCreateProject} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
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
  );
};

export default RecentActivity;
