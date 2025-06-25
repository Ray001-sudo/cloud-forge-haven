
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Bot, Monitor, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate('/dashboard/projects');
  };

  return (
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
  );
};

export default QuickActions;
