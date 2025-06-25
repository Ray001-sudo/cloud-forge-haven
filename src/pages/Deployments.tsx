
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  GitBranch, 
  Clock, 
  RefreshCw, 
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Deployment {
  id: string;
  project_id: string;
  status: string;
  build_status: string;
  commit_hash?: string;
  commit_message?: string;
  build_duration?: number;
  deployment_url?: string;
  created_at: string;
  deployed_at?: string;
}

interface BuildLog {
  id: string;
  message: string;
  log_level: string;
  created_at: string;
}

const Deployments = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [buildLogs, setBuildLogs] = useState<Record<string, BuildLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedDeployments, setExpandedDeployments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectId && user) {
      loadDeployments();
      
      // Set up real-time subscription for deployments
      const subscription = supabase
        .channel('deployments')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'deployments',
          filter: `project_id=eq.${projectId}`
        }, () => {
          loadDeployments();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [projectId, user]);

  const loadDeployments = async () => {
    try {
      setLoading(true);
      
      // Verify user owns this project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user?.id)
        .single();

      if (projectError || !project) {
        throw new Error('Project not found or access denied');
      }

      // Load deployments
      const { data, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeployments(data || []);
    } catch (error) {
      console.error('Error loading deployments:', error);
      toast.error('Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  const loadBuildLogs = async (deploymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('build_logs')
        .select('*')
        .eq('deployment_id', deploymentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setBuildLogs(prev => ({
        ...prev,
        [deploymentId]: data || []
      }));
    } catch (error) {
      console.error('Error loading build logs:', error);
      toast.error('Failed to load build logs');
    }
  };

  const toggleDeployment = (deploymentId: string) => {
    const newExpanded = new Set(expandedDeployments);
    if (newExpanded.has(deploymentId)) {
      newExpanded.delete(deploymentId);
    } else {
      newExpanded.add(deploymentId);
      // Load logs if not already loaded
      if (!buildLogs[deploymentId]) {
        loadBuildLogs(deploymentId);
      }
    }
    setExpandedDeployments(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
      case 'building':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      case 'pending': return 'bg-yellow-600';
      case 'building': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-slate-400';
      default: return 'text-slate-300';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Deployments</h1>
            <p className="text-slate-400 mt-1">
              View deployment history and build logs
            </p>
          </div>
          <Button
            onClick={loadDeployments}
            variant="outline"
            className="border-slate-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {deployments.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <GitBranch className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No deployments found</h3>
              <p className="text-slate-400">
                No deployments have been created for this project yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <Card key={deployment.id} className="bg-slate-800 border-slate-700">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div 
                      className="w-full p-6 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => toggleDeployment(deployment.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {expandedDeployments.has(deployment.id) ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                          {getStatusIcon(deployment.build_status)}
                          <div>
                            <div className="flex items-center space-x-3">
                              <Badge className={`${getStatusColor(deployment.build_status)} text-white`}>
                                {deployment.build_status}
                              </Badge>
                              {deployment.commit_hash && (
                                <span className="font-mono text-sm text-slate-300">
                                  {deployment.commit_hash.substring(0, 7)}
                                </span>
                              )}
                            </div>
                            {deployment.commit_message && (
                              <div className="text-sm text-slate-400 mt-1">
                                {deployment.commit_message}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-slate-400">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(deployment.created_at).toLocaleString()}
                          </div>
                          {deployment.build_duration && (
                            <div className="mt-1">
                              Duration: {deployment.build_duration}s
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-6 pb-6 border-t border-slate-700">
                      <div className="mt-4">
                        <h4 className="text-white font-medium mb-3">Build Logs</h4>
                        <div className="bg-slate-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                          {buildLogs[deployment.id] ? (
                            buildLogs[deployment.id].length > 0 ? (
                              buildLogs[deployment.id].map((log) => (
                                <div key={log.id} className="mb-1">
                                  <span className="text-slate-500">
                                    [{new Date(log.created_at).toLocaleTimeString()}]
                                  </span>
                                  <span className={`ml-2 ${getLogLevelColor(log.log_level)}`}>
                                    {log.log_level.toUpperCase()}:
                                  </span>
                                  <span className="text-slate-300 ml-1">
                                    {log.message}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-400 text-center py-8">
                                No build logs available for this deployment.
                              </div>
                            )
                          ) : (
                            <div className="text-slate-400 text-center py-8">
                              Loading build logs...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Deployments;
