import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FileManager from '@/components/FileManager';
import Terminal from '@/components/Terminal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  ExternalLink,
  Activity,
  Server,
  Database,
  Code,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  runtime: string;
  container_status: string;
  subdomain: string;
  port: number;
  cpu_limit: number;
  ram_limit: number;
  disk_limit: number;
  ssl_enabled: boolean;
  container_id: string | null;
  docker_image: string | null;
  last_deployed_at: string | null;
  build_command: string | null;
  start_command: string | null;
  custom_domain: string | null;
  environment_variables: any;
}

interface BuildLog {
  id: string;
  message: string;
  log_level: string;
  source: string;
  created_at: string;
}

interface ResourceStats {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
}

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [stats, setStats] = useState<ResourceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && user) {
      loadProject();
      loadLogs();
      loadStats();
      
      // Set up real-time subscriptions
      const logsSubscription = supabase
        .channel('build_logs')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'build_logs',
          filter: `project_id=eq.${projectId}`
        }, (payload) => {
          setLogs(prev => [payload.new as BuildLog, ...prev]);
        })
        .subscribe();

      // Refresh stats every 30 seconds
      const statsInterval = setInterval(loadStats, 30000);

      return () => {
        logsSubscription.unsubscribe();
        clearInterval(statsInterval);
      };
    }
  }, [projectId, user]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('build_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const loadStats = async () => {
    if (!project?.container_status || project.container_status !== 'running') {
      return;
    }

    try {
      const response = await fetch(`https://rfkktecqygejiwtcvgld.supabase.co/functions/v1/container-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJma2t0ZWNxeWdlaml3dGN2Z2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MTg0ODQsImV4cCI6MjA2NjE5NDQ4NH0.l27EiR58K0y8JwZOD66S5LKP8GX_scA-yZrUmwkqUSg`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'stats',
          projectId: projectId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleProjectAction = async (action: 'start' | 'stop' | 'restart' | 'build') => {
    if (!project) return;

    try {
      setActionLoading(action);
      
      const response = await fetch(`https://rfkktecqygejiwtcvgld.supabase.co/functions/v1/container-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJma2t0ZWNxeWdlaml3dGN2Z2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MTg0ODQsImV4cCI6MjA2NjE5NDQ4NH0.l27EiR58K0y8JwZOD66S5LKP8GX_scA-yZrUmwkqUSg`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          projectId: project.id,
          userId: user?.id,
          buildConfig: action === 'build' ? {
            runtime: project.runtime,
            buildCommand: project.build_command,
            startCommand: project.start_command,
            environmentVariables: project.environment_variables
          } : undefined
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message);
        await loadProject();
        if (action === 'start' || action === 'restart') {
          setTimeout(loadStats, 2000);
        }
      } else {
        throw new Error(result.error || 'Action failed');
      }
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
      toast.error(`Failed to ${action} project: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          description: project.description,
          custom_domain: project.custom_domain,
          build_command: project.build_command,
          start_command: project.start_command,
          environment_variables: project.environment_variables
        })
        .eq('id', project.id);

      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-600';
      case 'stopped': return 'bg-gray-600';
      case 'building': return 'bg-yellow-600';
      case 'error': return 'bg-red-600';
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

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Project Not Found</h3>
            <p className="text-slate-400">The project you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const projectUrl = project.custom_domain 
    ? `https://${project.custom_domain}` 
    : `https://${project.subdomain}.cloudforge.dev`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <p className="text-slate-400 mt-1">
              {project.description} • {project.runtime}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(project.container_status)} text-white`}>
              {project.container_status}
            </Badge>
            <div className="flex space-x-2">
              {!project.docker_image && (
                <Button 
                  onClick={() => handleProjectAction('build')}
                  disabled={actionLoading === 'build'}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  {actionLoading === 'build' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Code className="h-4 w-4 mr-2" />
                  )}
                  Build
                </Button>
              )}
              
              {project.container_status === 'stopped' ? (
                <Button 
                  onClick={() => handleProjectAction('start')}
                  disabled={actionLoading === 'start' || !project.docker_image}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === 'start' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start
                </Button>
              ) : (
                <Button 
                  onClick={() => handleProjectAction('stop')}
                  disabled={actionLoading === 'stop'}
                  variant="outline"
                  className="border-slate-600"
                >
                  {actionLoading === 'stop' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Stop
                </Button>
              )}
              <Button 
                onClick={() => handleProjectAction('restart')}
                disabled={actionLoading === 'restart' || !project.docker_image}
                variant="outline"
                className="border-slate-600"
              >
                {actionLoading === 'restart' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Restart
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-400" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats ? `${stats.cpu_usage.toFixed(1)}%` : '--'}
              </div>
              <p className="text-sm text-slate-400">
                Limit: {project.cpu_limit} cores
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Server className="h-5 w-5 mr-2 text-blue-400" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats ? `${stats.memory_usage}MB` : '--'}
              </div>
              <p className="text-sm text-slate-400">
                / {project.ram_limit}MB allocated
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-400" />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats ? `${stats.disk_usage}MB` : '--'}
              </div>
              <p className="text-sm text-slate-400">
                / {project.disk_limit}MB limit
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Code className="h-5 w-5 mr-2 text-sky-400" />
                Deployed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">
                {project.last_deployed_at 
                  ? new Date(project.last_deployed_at).toLocaleDateString()
                  : 'Never'
                }
              </div>
              {project.container_status === 'running' && (
                <a 
                  href={projectUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-sky-400 hover:text-sky-300 flex items-center"
                >
                  View App <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="files" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="files" className="data-[state=active]:bg-slate-700">
              Files
            </TabsTrigger>
            <TabsTrigger value="terminal" className="data-[state=active]:bg-slate-700">
              Terminal
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">
              Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 h-[600px]">
              <FileManager projectId={project.id} projectName={project.name} />
            </Card>
          </TabsContent>

          <TabsContent value="terminal" className="space-y-6">
            <Terminal projectId={project.id} projectName={project.name} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Application Logs</CardTitle>
                  <Button
                    onClick={loadLogs}
                    size="sm"
                    variant="outline"
                    className="border-slate-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-slate-400 text-center py-8">
                      No logs available. Build or start your project to see logs.
                    </div>
                  ) : (
                    logs.map((log) => (
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
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Project Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Project Name</label>
                  <Input 
                    type="text" 
                    value={project.name}
                    onChange={(e) => setProject({...project, name: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <Textarea 
                    value={project.description || ''}
                    onChange={(e) => setProject({...project, description: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Custom Domain</label>
                  <Input 
                    type="text" 
                    value={project.custom_domain || ''}
                    onChange={(e) => setProject({...project, custom_domain: e.target.value})}
                    placeholder="your-domain.com"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Build Command</label>
                    <Input 
                      type="text" 
                      value={project.build_command || ''}
                      onChange={(e) => setProject({...project, build_command: e.target.value})}
                      placeholder="npm run build"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Start Command</label>
                    <Input 
                      type="text" 
                      value={project.start_command || ''}
                      onChange={(e) => setProject({...project, start_command: e.target.value})}
                      placeholder="npm start"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveSettings} className="bg-sky-600 hover:bg-sky-700">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetail;
