
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Rocket, 
  Github, 
  Upload, 
  MessageSquare,
  Play,
  Square,
  Trash2,
  ExternalLink,
  Settings,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

const Projects = () => {
  const [projects, setProjects] = useState([
    {
      id: '1',
      name: 'my-web-app',
      description: 'React web application',
      runtime: 'Node.js 18',
      status: 'running',
      url: 'https://my-web-app.cloudforge.app',
      lastDeployed: '2 hours ago',
      cpu: 15,
      memory: 256
    },
    {
      id: '2',
      name: 'telegram-bot',
      description: 'Python Telegram bot',
      runtime: 'Python 3.11',
      status: 'stopped',
      url: 'https://telegram-bot.cloudforge.app',
      lastDeployed: '1 day ago',
      cpu: 0,
      memory: 128
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    runtime: '',
    deploymentType: 'github'
  });

  const handleCreateProject = () => {
    if (!createForm.name || !createForm.runtime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newProject = {
      id: Date.now().toString(),
      name: createForm.name,
      description: createForm.description,
      runtime: createForm.runtime,
      status: 'building',
      url: `https://${createForm.name}.cloudforge.app`,
      lastDeployed: 'Building...',
      cpu: 0,
      memory: 0
    };

    setProjects([newProject, ...projects]);
    setIsCreateDialogOpen(false);
    setCreateForm({ name: '', description: '', runtime: '', deploymentType: 'github' });
    
    toast.success('Project created! Deployment starting...');
    
    // Simulate deployment process
    setTimeout(() => {
      setProjects(prev => prev.map(p => 
        p.id === newProject.id 
          ? { ...p, status: 'running', lastDeployed: 'Just now', cpu: 12, memory: 256 }
          : p
      ));
      toast.success('Deployment completed successfully!');
    }, 5000);
  };

  const handleProjectAction = (projectId: string, action: string) => {
    setProjects(prev => prev.map(project => {
      if (project.id === projectId) {
        switch (action) {
          case 'start':
            toast.success('Starting project...');
            return { ...project, status: 'running', cpu: 12 };
          case 'stop':
            toast.success('Stopping project...');
            return { ...project, status: 'stopped', cpu: 0 };
          case 'restart':
            toast.success('Restarting project...');
            return { ...project, status: 'running', lastDeployed: 'Just now' };
          case 'delete':
            toast.success('Project deleted');
            return null;
          default:
            return project;
        }
      }
      return project;
    }).filter(Boolean));
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
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-slate-400 mt-1">Manage your deployed applications</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-600 hover:bg-sky-700">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Deploy your application using GitHub, ZIP upload, or natural language
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={createForm.deploymentType} onValueChange={(value) => setCreateForm({...createForm, deploymentType: value})}>
                <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                  <TabsTrigger value="github" className="data-[state=active]:bg-slate-600">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="data-[state=active]:bg-slate-600">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload ZIP
                  </TabsTrigger>
                  <TabsTrigger value="prompt" className="data-[state=active]:bg-slate-600">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    AI Prompt
                  </TabsTrigger>
                </TabsList>
                
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Project Name *</Label>
                      <Input
                        id="name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                        placeholder="my-awesome-app"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="runtime">Runtime *</Label>
                      <Select value={createForm.runtime} onValueChange={(value) => setCreateForm({...createForm, runtime: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select runtime" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="node18">Node.js 18</SelectItem>
                          <SelectItem value="node16">Node.js 16</SelectItem>
                          <SelectItem value="python311">Python 3.11</SelectItem>
                          <SelectItem value="python39">Python 3.9</SelectItem>
                          <SelectItem value="php81">PHP 8.1</SelectItem>
                          <SelectItem value="go119">Go 1.19</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                      placeholder="Brief description of your project"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  
                  <TabsContent value="github" className="space-y-4">
                    <div>
                      <Label htmlFor="repo">Repository URL</Label>
                      <Input
                        id="repo"
                        placeholder="https://github.com/username/repo"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        placeholder="main"
                        defaultValue="main"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-400">Drag and drop your ZIP file here, or click to browse</p>
                      <Button variant="outline" className="mt-2 border-slate-600">
                        Choose File
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="prompt" className="space-y-4">
                    <div>
                      <Label htmlFor="prompt">Describe your project</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Create a Telegram bot using Flask that responds to /start command..."
                        className="bg-slate-700 border-slate-600 min-h-[100px]"
                      />
                    </div>
                  </TabsContent>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-600">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} className="bg-sky-600 hover:bg-sky-700">
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy Project
                  </Button>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <CardTitle className="text-white">{project.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {project.description} • {project.runtime}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(project.status)} text-white`}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-sm">
                      <p className="text-slate-400">Last deployed</p>
                      <p className="text-white">{project.lastDeployed}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-400">CPU</p>
                      <p className="text-white">{project.cpu}%</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-400">Memory</p>
                      <p className="text-white">{project.memory}MB</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-400">URL</p>
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 flex items-center">
                        {project.url.replace('https://', '')}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {project.status === 'stopped' ? (
                      <Button 
                        size="sm" 
                        onClick={() => handleProjectAction(project.id, 'start')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleProjectAction(project.id, 'stop')}
                        className="border-slate-600"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="border-slate-600">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600">
                      <Activity className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleProjectAction(project.id, 'delete')}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <Card className="bg-slate-800 border-slate-700 text-center py-12">
            <CardContent>
              <Rocket className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-slate-400 mb-4">Create your first project to get started with CloudForge</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-sky-600 hover:bg-sky-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects;
