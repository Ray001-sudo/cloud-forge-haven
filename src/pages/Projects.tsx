
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Rocket, 
  Globe, 
  Clock, 
  Play, 
  Square, 
  Trash2, 
  ExternalLink,
  Github,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  app_type: string;
  runtime: string;
  container_status: string;
  repository_url: string | null;
  custom_domain: string | null;
  created_at: string;
  last_deployed_at: string | null;
  user_id: string;
  branch: string | null;
  build_command: string | null;
  start_command: string | null;
  environment_variables: any;
  updated_at: string | null;
}

const Projects = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form states
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    app_type: 'web',
    runtime: 'nodejs',
    repository_url: ''
  });

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    // Check plan limits
    const maxProjects = profile?.subscription_tier === 'free' ? 1 : 
                       profile?.subscription_tier === 'pro' ? 10 : 50;
    
    if (projects.length >= maxProjects) {
      toast.error(`You've reached the limit of ${maxProjects} projects for your plan. Please upgrade.`);
      navigate('/dashboard/billing');
      return;
    }

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user?.id,
          name: newProject.name.trim(),
          description: newProject.description.trim() || null,
          app_type: newProject.app_type,
          runtime: newProject.runtime,
          repository_url: newProject.repository_url.trim() || null,
          container_status: 'stopped'
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial log entry using type casting
      await (supabase as any)
        .from('project_logs')
        .insert({
          project_id: data.id,
          message: 'Project created successfully',
          log_level: 'info',
          source: 'system'
        });

      toast.success('Project created successfully!');
      setShowCreateDialog(false);
      setNewProject({
        name: '',
        description: '',
        app_type: 'web',
        runtime: 'nodejs',
        repository_url: ''
      });
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleProjectAction = async (projectId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const newStatus = action === 'stop' ? 'stopped' : 'running';
      
      const { error } = await supabase
        .from('projects')
        .update({ 
          container_status: newStatus,
          last_deployed_at: action !== 'stop' ? new Date().toISOString() : undefined
        })
        .eq('id', projectId);

      if (error) throw error;

      // Log the action using type casting
      await (supabase as any)
        .from('project_logs')
        .insert({
          project_id: projectId,
          message: `Project ${action}ed by user`,
          log_level: 'info',
          source: 'user'
        });

      toast.success(`Project ${action}ed successfully`);
      loadProjects();
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
      toast.error(`Failed to ${action} project`);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Project deleted successfully');
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
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

  const getRuntimeIcon = (runtime: string) => {
    switch (runtime) {
      case 'nodejs': return '🟢';
      case 'python': return '🐍';
      case 'php': return '🐘';
      case 'ruby': return '💎';
      case 'go': return '🐹';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#38BDF8]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-slate-400 mt-1">
              Manage and deploy your applications ({projects.length} projects)
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#38BDF8] hover:bg-[#0EA5E9]">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E293B] border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="my-awesome-app"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project..."
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Project Type</Label>
                    <Select 
                      value={newProject.app_type} 
                      onValueChange={(value) => setNewProject(prev => ({ ...prev, app_type: value }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="web">Web Application</SelectItem>
                        <SelectItem value="api">API/Backend</SelectItem>
                        <SelectItem value="bot">Discord/Telegram Bot</SelectItem>
                        <SelectItem value="worker">Background Worker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Runtime</Label>
                    <Select 
                      value={newProject.runtime} 
                      onValueChange={(value) => setNewProject(prev => ({ ...prev, runtime: value }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="nodejs">Node.js 18</SelectItem>
                        <SelectItem value="python">Python 3.11</SelectItem>
                        <SelectItem value="php">PHP 8.1</SelectItem>
                        <SelectItem value="ruby">Ruby 3.0</SelectItem>
                        <SelectItem value="go">Go 1.19</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repo" className="text-white">Repository URL (Optional)</Label>
                  <Input
                    id="repo"
                    placeholder="https://github.com/username/repo"
                    value={newProject.repository_url}
                    onChange={(e) => setNewProject(prev => ({ ...prev, repository_url: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCreateDialog(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={creating}
                    className="bg-[#38BDF8] hover:bg-[#0EA5E9]"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="bg-[#1E293B] border-slate-700">
            <CardContent className="py-12 text-center">
              <Rocket className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-slate-400 mb-6">
                Create your first project to get started with CloudForge
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#38BDF8] hover:bg-[#0EA5E9]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-[#1E293B] border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getRuntimeIcon(project.runtime)}</span>
                      <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                    </div>
                    <Badge className={`${getStatusColor(project.container_status)} text-white`}>
                      {project.container_status}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-slate-400 text-sm line-clamp-2">{project.description}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-white capitalize">{project.app_type}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Runtime:</span>
                    <span className="text-white">{project.runtime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Created:</span>
                    <span className="text-white">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {project.last_deployed_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Last Deployed:</span>
                      <span className="text-white">
                        {new Date(project.last_deployed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2">
                    {project.container_status === 'stopped' ? (
                      <Button
                        size="sm"
                        onClick={() => handleProjectAction(project.id, 'start')}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleProjectAction(project.id, 'stop')}
                        variant="outline"
                        className="border-slate-600 flex-1"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                      className="bg-[#38BDF8] hover:bg-[#0EA5E9] flex-1"
                    >
                      Manage
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    {project.repository_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(project.repository_url!, '_blank')}
                        className="text-slate-400 hover:text-white p-2"
                      >
                        <Github className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {project.custom_domain && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://${project.custom_domain}`, '_blank')}
                        className="text-slate-400 hover:text-white p-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProject(project)}
                      className="text-red-400 hover:text-red-300 p-2 ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects;
