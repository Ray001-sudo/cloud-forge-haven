
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  RefreshCw, 
  Download, 
  Filter,
  Search,
  Play,
  Pause,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface BuildLog {
  id: string;
  message: string;
  log_level: string;
  source: string;
  created_at: string;
  deployment_id?: string;
}

interface Deployment {
  id: string;
  created_at: string;
  status: string;
  commit_hash?: string;
}

const Logs = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<string>('all');
  const [logLevel, setLogLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (projectId && user) {
      loadLogs();
      loadDeployments();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('build_logs')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'build_logs',
          filter: `project_id=eq.${projectId}`
        }, (payload) => {
          setLogs(prev => [payload.new as BuildLog, ...prev]);
          if (autoScroll) {
            scrollToBottom();
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [projectId, user]);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadLogs, 5000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  const loadLogs = async () => {
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

      let query = supabase
        .from('build_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (selectedDeployment !== 'all') {
        query = query.eq('deployment_id', selectedDeployment);
      }

      if (logLevel !== 'all') {
        query = query.eq('log_level', logLevel);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const loadDeployments = async () => {
    try {
      const { data, error } = await supabase
        .from('deployments')
        .select('id, created_at, status, commit_hash')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setDeployments(data || []);
    } catch (error) {
      console.error('Error loading deployments:', error);
    }
  };

  const scrollToBottom = () => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  };

  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${new Date(log.created_at).toISOString()}] ${log.log_level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${projectId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Logs exported successfully');
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

  const filteredLogs = logs.filter(log => {
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Application Logs</h1>
            <p className="text-slate-400 mt-1">
              View real-time logs and debug your application
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <span className="text-sm text-slate-400">Auto-scroll</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <span className="text-sm text-slate-400">Auto-refresh</span>
            </div>
            <Button
              onClick={exportLogs}
              variant="outline"
              className="border-slate-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={loadLogs}
              variant="outline"
              className="border-slate-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Deployment
                </label>
                <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Deployments</SelectItem>
                    {deployments.map((deployment) => (
                      <SelectItem key={deployment.id} value={deployment.id}>
                        {deployment.commit_hash?.substring(0, 7) || deployment.id.substring(0, 8)} - {deployment.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Log Level
                </label>
                <Select value={logLevel} onValueChange={setLogLevel}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Display */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                Logs ({filteredLogs.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                {autoRefresh && (
                  <div className="flex items-center text-sm text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={logsContainerRef}
              className="bg-slate-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  No logs available matching your criteria.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="mb-1 hover:bg-slate-800 px-2 py-1 rounded">
                    <span className="text-slate-500">
                      [{new Date(log.created_at).toLocaleTimeString()}]
                    </span>
                    <span className={`ml-2 ${getLogLevelColor(log.log_level)}`}>
                      {log.log_level.toUpperCase()}:
                    </span>
                    <span className="text-slate-300 ml-1">
                      {log.message}
                    </span>
                    {log.source !== 'build' && (
                      <span className="text-slate-500 ml-2">
                        [{log.source}]
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Logs;
