
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Trash2, 
  Plus,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description?: string;
  runtime: string;
  app_type: string;
  repository_url?: string;
  branch?: string;
  build_command?: string;
  start_command?: string;
  custom_domain?: string;
  cpu_limit: number;
  ram_limit: number;
  disk_limit: number;
  ssl_enabled: boolean;
  environment_variables: Record<string, string>;
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  useEffect(() => {
    if (projectId && user) {
      loadProject();
    }
  }, [projectId, user]);

  const loadProject = async () => {
    try {
      setLoading(true);
      
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
      toast.error('Failed to load project settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          description: project.description,
          runtime: project.runtime,
          app_type: project.app_type,
          repository_url: project.repository_url,
          branch: project.branch,
          build_command: project.build_command,
          start_command: project.start_command,
          custom_domain: project.custom_domain,
          cpu_limit: project.cpu_limit,
          ram_limit: project.ram_limit,
          disk_limit: project.disk_limit,
          ssl_enabled: project.ssl_enabled,
          environment_variables: project.environment_variables,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) throw error;
      
      toast.success('Project settings saved successfully');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    try {
      // Delete project and all related data
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;
      
      toast.success('Project deleted successfully');
      // Redirect to projects page
      window.location.href = '/dashboard/projects';
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const addEnvironmentVariable = () => {
    if (!newEnvKey.trim() || !project) return;

    setProject({
      ...project,
      environment_variables: {
        ...project.environment_variables,
        [newEnvKey]: newEnvValue
      }
    });

    setNewEnvKey('');
    setNewEnvValue('');
  };

  const removeEnvironmentVariable = (key: string) => {
    if (!project) return;

    const newEnvVars = { ...project.environment_variables };
    delete newEnvVars[key];

    setProject({
      ...project,
      environment_variables: newEnvVars
    });
  };

  const updateEnvironmentVariable = (key: string, value: string) => {
    if (!project) return;

    setProject({
      ...project,
      environment_variables: {
        ...project.environment_variables,
        [key]: value
      }
    });
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Project Settings</h1>
            <p className="text-slate-400 mt-1">
              Configure your project settings and environment
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Project Name
                </label>
                <Input
                  value={project.name}
                  onChange={(e) => setProject({...project, name: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <Textarea
                  value={project.description || ''}
                  onChange={(e) => setProject({...project, description: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Runtime
                </label>
                <Select
                  value={project.runtime}
                  onValueChange={(value) => setProject({...project, runtime: value})}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="nodejs">Node.js</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="docker">Docker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Application Type
                </label>
                <Select
                  value={project.app_type}
                  onValueChange={(value) => setProject({...project, app_type: value})}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="web">Web Application</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="worker">Background Worker</SelectItem>
                    <SelectItem value="cron">Cron Job</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Deployment Settings */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Deployment Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Repository URL
                </label>
                <Input
                  value={project.repository_url || ''}
                  onChange={(e) => setProject({...project, repository_url: e.target.value})}
                  placeholder="https://github.com/username/repo"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Branch
                </label>
                <Input
                  value={project.branch || 'main'}
                  onChange={(e) => setProject({...project, branch: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Build Command
                </label>
                <Input
                  value={project.build_command || ''}
                  onChange={(e) => setProject({...project, build_command: e.target.value})}
                  placeholder="npm run build"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Start Command
                </label>
                <Input
                  value={project.start_command || ''}
                  onChange={(e) => setProject({...project, start_command: e.target.value})}
                  placeholder="npm start"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Custom Domain
                </label>
                <Input
                  value={project.custom_domain || ''}
                  onChange={(e) => setProject({...project, custom_domain: e.target.value})}
                  placeholder="your-domain.com"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  SSL Enabled
                </label>
                <Switch
                  checked={project.ssl_enabled}
                  onCheckedChange={(checked) => setProject({...project, ssl_enabled: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resource Limits */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Resource Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  CPU Limit (cores)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="4"
                  value={project.cpu_limit}
                  onChange={(e) => setProject({...project, cpu_limit: parseFloat(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  RAM Limit (MB)
                </label>
                <Input
                  type="number"
                  min="64"
                  max="8192"
                  value={project.ram_limit}
                  onChange={(e) => setProject({...project, ram_limit: parseInt(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Disk Limit (MB)
                </label>
                <Input
                  type="number"
                  min="512"
                  max="51200"
                  value={project.disk_limit}
                  onChange={(e) => setProject({...project, disk_limit: parseInt(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Environment Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {Object.entries(project.environment_variables || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Input
                      value={key}
                      readOnly
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                    />
                    <Input
                      value={value}
                      onChange={(e) => updateEnvironmentVariable(key, e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeEnvironmentVariable(key)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Key"
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                />
                <Input
                  placeholder="Value"
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                />
                <Button
                  size="sm"
                  onClick={addEnvironmentVariable}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="bg-slate-800 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Delete Project</h4>
                <p className="text-slate-400 text-sm">
                  Permanently delete this project and all its data. This action cannot be undone.
                </p>
              </div>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
            
            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <p className="text-red-400 mb-4">
                  Are you sure you want to delete this project? Type the project name to confirm:
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder={project.name}
                    className="bg-slate-700 border-slate-600 text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value === project.name) {
                        handleDelete();
                      }
                    }}
                  />
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="border-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
