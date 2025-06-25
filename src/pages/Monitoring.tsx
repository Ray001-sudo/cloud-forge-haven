
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  TrendingUp, 
  AlertTriangle,
  Server,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  container_status: string;
  subdomain: string;
}

interface ResourceUsage {
  id: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  recorded_at: string;
}

const Monitoring = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [resourceData, setResourceData] = useState<ResourceUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStats, setCurrentStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  });

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      loadResourceData();
      const interval = setInterval(loadResourceData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, container_status, subdomain')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      
      setProjects(data || []);
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const loadResourceData = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);

      // Get resource usage data for the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('resource_usage')
        .select('*')
        .eq('project_id', selectedProject)
        .gte('recorded_at', twentyFourHoursAgo)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      setResourceData(data || []);
      
      // Set current stats from latest data
      if (data && data.length > 0) {
        const latest = data[data.length - 1];
        setCurrentStats({
          cpu: latest.cpu_usage,
          memory: latest.memory_usage,
          disk: latest.disk_usage,
          network: (latest.network_in + latest.network_out) / 2
        });
      }

      // If no data exists, fetch current stats from container
      if (!data || data.length === 0) {
        await fetchCurrentStats();
      }

    } catch (error) {
      console.error('Error loading resource data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStats = async () => {
    try {
      const response = await fetch(`https://rfkktecqygejiwtcvgld.supabase.co/functions/v1/container-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJma2t0ZWNxeWdlaml3dGN2Z2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MTg0ODQsImV4cCI6MjA2NjE5NDQ4NH0.l27EiR58K0y8JwZOD66S5LKP8GX_scA-yZrUmwkqUSg`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'stats',
          projectId: selectedProject
        })
      });

      if (response.ok) {
        const stats = await response.json();
        setCurrentStats({
          cpu: stats.cpu_usage || 0,
          memory: stats.memory_usage || 0,
          disk: stats.disk_usage || 0,
          network: (stats.network_in + stats.network_out) / 2 || 0
        });
      }
    } catch (error) {
      console.error('Error fetching current stats:', error);
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const formatChartData = (data: ResourceUsage[]) => {
    return data.map(item => ({
      time: new Date(item.recorded_at).toLocaleTimeString(),
      cpu: parseFloat(item.cpu_usage.toString()),
      memory: item.memory_usage,
      disk: item.disk_usage,
      networkIn: item.network_in,
      networkOut: item.network_out
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-600';
      case 'stopped': return 'bg-gray-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (projects.length === 0 && !loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Server className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Projects Found</h3>
            <p className="text-slate-400">Create a project to start monitoring resources</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Monitoring</h1>
            <p className="text-slate-400 mt-1">Real-time resource usage and performance metrics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.container_status)}`} />
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProjectData && (
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedProjectData.name}</h2>
                <p className="text-slate-400">https://{selectedProjectData.subdomain}.cloudforge.dev</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(selectedProjectData.container_status)} text-white`}>
              {selectedProjectData.container_status}
            </Badge>
          </div>
        )}

        {/* Current Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-sm font-medium">
                <Cpu className="h-4 w-4 mr-2 text-blue-400" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{currentStats.cpu.toFixed(1)}%</div>
              <p className="text-xs text-slate-400">Current load</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-sm font-medium">
                <Activity className="h-4 w-4 mr-2 text-green-400" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{currentStats.memory} MB</div>
              <p className="text-xs text-slate-400">RAM usage</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-sm font-medium">
                <HardDrive className="h-4 w-4 mr-2 text-purple-400" />
                Disk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{currentStats.disk} MB</div>
              <p className="text-xs text-slate-400">Storage used</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center text-sm font-medium">
                <Network className="h-4 w-4 mr-2 text-yellow-400" />
                Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{currentStats.network.toFixed(1)} MB</div>
              <p className="text-xs text-slate-400">Avg I/O</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">CPU & Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(resourceData)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#10B981" strokeWidth={2} name="Memory MB" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Network Traffic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formatChartData(resourceData)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Area type="monotone" dataKey="networkIn" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="Inbound MB" />
                    <Area type="monotone" dataKey="networkOut" stackId="1" stroke="#EF4444" fill="#EF4444" name="Outbound MB" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resource Alerts */}
        {(currentStats.cpu > 80 || currentStats.memory > 200) && (
          <Card className="bg-slate-800 border-red-500">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                Resource Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentStats.cpu > 80 && (
                  <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-red-400" />
                      <span className="text-white">High CPU Usage</span>
                    </div>
                    <Badge className="bg-red-600 text-white">{currentStats.cpu.toFixed(1)}%</Badge>
                  </div>
                )}
                {currentStats.memory > 200 && (
                  <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-red-400" />
                      <span className="text-white">High Memory Usage</span>
                    </div>
                    <Badge className="bg-red-600 text-white">{currentStats.memory} MB</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Monitoring;
