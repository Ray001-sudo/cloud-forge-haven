
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FileManager from '@/components/FileManager';
import Terminal from '@/components/Terminal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  ExternalLink,
  Activity,
  Server,
  Database,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState({
    id: projectId,
    name: 'my-web-app',
    description: 'React web application',
    runtime: 'Node.js 18',
    status: 'running',
    url: 'https://my-web-app.cloudforge.app',
    lastDeployed: '2 hours ago',
    cpu: 15,
    memory: 256,
    uptime: '99.9%'
  });

  const handleProjectAction = (action: string) => {
    switch (action) {
      case 'start':
        setProject(prev => ({ ...prev, status: 'running', cpu: 12 }));
        toast.success('Project started successfully');
        break;
      case 'stop':
        setProject(prev => ({ ...prev, status: 'stopped', cpu: 0 }));
        toast.success('Project stopped successfully');
        break;
      case 'restart':
        setProject(prev => ({ ...prev, status: 'running', lastDeployed: 'Just now' }));
        toast.success('Project restarted successfully');
        break;
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <p className="text-slate-400 mt-1">{project.description} • {project.runtime}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(project.status)} text-white`}>
              {project.status}
            </Badge>
            <div className="flex space-x-2">
              {project.status === 'stopped' ? (
                <Button 
                  onClick={() => handleProjectAction('start')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button 
                  onClick={() => handleProjectAction('stop')}
                  variant="outline"
                  className="border-slate-600"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
              <Button 
                onClick={() => handleProjectAction('restart')}
                variant="outline"
                className="border-slate-600"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
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
              <div className="text-2xl font-bold text-white">{project.cpu}%</div>
              <p className="text-sm text-slate-400">Current usage</p>
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
              <div className="text-2xl font-bold text-white">{project.memory}MB</div>
              <p className="text-sm text-slate-400">/ 1GB allocated</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-400" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{project.uptime}</div>
              <p className="text-sm text-slate-400">Last 30 days</p>
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
              <div className="text-lg font-bold text-white">{project.lastDeployed}</div>
              <a 
                href={project.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-sky-400 hover:text-sky-300 flex items-center"
              >
                View App <ExternalLink className="ml-1 h-3 w-3" />
              </a>
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
              <FileManager projectId={project.id!} projectName={project.name} />
            </Card>
          </TabsContent>

          <TabsContent value="terminal" className="space-y-6">
            <Terminal projectId={project.id!} projectName={project.name} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Application Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                  <div className="text-slate-300">
                    <div className="text-green-400">[2024-01-15 10:30:00] INFO: Application started</div>
                    <div className="text-blue-400">[2024-01-15 10:30:01] INFO: Server running on port 3000</div>
                    <div className="text-green-400">[2024-01-15 10:30:02] INFO: Database connected</div>
                    <div className="text-yellow-400">[2024-01-15 10:30:03] WARN: High memory usage detected</div>
                    <div className="text-green-400">[2024-01-15 10:30:04] INFO: Request processed successfully</div>
                  </div>
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
                  <input 
                    type="text" 
                    value={project.name}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <textarea 
                    value={project.description}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Custom Domain</label>
                  <input 
                    type="text" 
                    placeholder="your-domain.com"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <Button className="bg-sky-600 hover:bg-sky-700">
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
