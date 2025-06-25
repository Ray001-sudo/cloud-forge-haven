
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  username: string;
  subscriptionTier: string;
  onCreateProject: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  username,
  subscriptionTier,
  onCreateProject
}) => {
  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'bg-sky-600';
      case 'elite': return 'bg-purple-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {username || 'User'}!
        </h1>
        <p className="text-slate-400 mt-1">
          Manage your cloud applications and deployments
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <Badge className={`${getPlanColor(subscriptionTier)} text-white`}>
          {subscriptionTier?.toUpperCase() || 'FREE'} PLAN
        </Badge>
        <Button onClick={onCreateProject} className="bg-sky-600 hover:bg-sky-700">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
