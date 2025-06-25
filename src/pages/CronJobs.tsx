import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  command: string;
  project_id: string;
  status: 'active' | 'paused' | 'error';
  last_run?: string;
  next_run: string;
  last_output?: string;
  success_count: number;
  error_count: number;
  created_at: string;
  projects?: {
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
}

const CronJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [newJob, setNewJob] = useState({
    name: '',
    schedule: '',
    command: '',
    project_id: '',
    quickSchedule: ''
  });

  const quickSchedules = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Daily at 9 AM', value: '0 9 * * *' },
    { label: 'Weekly (Mondays at 9 AM)', value: '0 9 * * 1' },
    { label: 'Monthly (1st at midnight)', value: '0 0 1 * *' }
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCronJobs(), loadProjects()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load cron jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadCronJobs = async () => {
    const { data, error } = await supabase
      .from('cron_jobs')
      .select(`
        *,
        projects (
          name
        )
      `)
      .in('project_id', 
        await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user?.id)
          .then(({ data }) => data?.map(p => p.id) || [])
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    setJobs((data || []).map(job => ({
      ...job,
      status: job.status as 'active' | 'paused' | 'error'
    })));
  };

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user?.id)
      .order('name');

    if (error) throw error;
    setProjects(data || []);
  };

  const handleCreateJob = async () => {
    if (!newJob.name || !newJob.schedule || !newJob.command || !newJob.project_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      
      // Calculate next run time
      const nextRun = new Date();
      switch (newJob.schedule) {
        case '* * * * *':
          nextRun.setMinutes(nextRun.getMinutes() + 1);
          break;
        case '*/5 * * * *':
          nextRun.setMinutes(Math.ceil(nextRun.getMinutes() / 5) * 5);
          break;
        case '0 * * * *':
          nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
          break;
        case '0 0 * * *':
          nextRun.setDate(nextRun.getDate() + 1);
          nextRun.setHours(0, 0, 0, 0);
          break;
        default:
          nextRun.setHours(nextRun.getHours() + 1);
      }
      
      const { error } = await supabase
        .from('cron_jobs')
        .insert({
          name: newJob.name,
          schedule: newJob.schedule,
          command: newJob.command,
          project_id: newJob.project_id,
          status: 'active',
          next_run: nextRun.toISOString()
        });

      if (error) throw error;

      toast.success('Cron job created successfully');
      setNewJob({ name: '', schedule: '', command: '', project_id: '', quickSchedule: '' });
      setIsCreateDialogOpen(false);
      loadCronJobs();
    } catch (error) {
      console.error('Error creating cron job:', error);
      toast.error('Failed to create cron job');
    } finally {
      setCreating(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('cron_jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      toast.success(`Job ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`);
      loadCronJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this cron job?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cron_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast.success('Cron job deleted successfully');
      loadCronJobs();
    } catch (error) {
      console.error('Error deleting cron job:', error);
      toast.error('Failed to delete cron job');
    }
  };

  const runJobNow = async (jobId: string) => {
    try {
      const response = await fetch(`https://rfkktecqygejiwtcvgld.supabase.co/functions/v1/cron-executor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJma2t0ZWNxeWdlaml3dGN2Z2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MTg0ODQsImV4cCI6MjA2NjE5NDQ4NH0.l27EiR58K0y8JwZOD66S5LKP8GX_scA-yZrUmwkqUSg`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        toast.success('Job executed manually');
        loadCronJobs();
      } else {
        throw new Error('Failed to execute job');
      }
    } catch (error) {
      console.error('Error running job:', error);
      toast.error('Failed to execute job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'paused': return 'bg-yellow-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
            <h1 className="text-3xl font-bold text-white">Cron Jobs</h1>
            <p className="text-slate-400 mt-1">Schedule and manage automated tasks ({jobs.length} jobs)</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-600 hover:bg-sky-700">
                <Plus className="mr-2 h-4 w-4" />
                New Cron Job
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Cron Job</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Schedule a command to run automatically at specified intervals
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job-name">Job Name *</Label>
                    <Input
                      id="job-name"
                      value={newJob.name}
                      onChange={(e) => setNewJob({...newJob, name: e.target.value})}
                      placeholder="Daily backup"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project">Project *</Label>
                    <Select value={newJob.project_id} onValueChange={(value) => setNewJob({...newJob, project_id: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="quick-schedule">Quick Schedule</Label>
                  <Select 
                    value={newJob.quickSchedule} 
                    onValueChange={(value) => setNewJob({...newJob, quickSchedule: value, schedule: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Choose a preset or enter custom" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {quickSchedules.map(schedule => (
                        <SelectItem key={schedule.value} value={schedule.value}>
                          {schedule.label} ({schedule.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schedule">Cron Expression *</Label>
                  <Input
                    id="schedule"
                    value={newJob.schedule}
                    onChange={(e) => setNewJob({...newJob, schedule: e.target.value})}
                    placeholder="0 2 * * *"
                    className="bg-slate-700 border-slate-600 font-mono"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Format: minute hour day month weekday (e.g., "0 2 * * *" for daily at 2 AM)
                  </p>
                </div>

                <div>
                  <Label htmlFor="command">Command *</Label>
                  <Textarea
                    id="command"
                    value={newJob.command}
                    onChange={(e) => setNewJob({...newJob, command: e.target.value})}
                    placeholder="python backup.py"
                    className="bg-slate-700 border-slate-600 font-mono"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-600">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateJob} disabled={creating} className="bg-sky-600 hover:bg-sky-700">
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Create Job
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {jobs.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 text-center py-12">
              <CardContent>
                <Clock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No cron jobs yet</h3>
                <p className="text-slate-400 mb-4">Create your first scheduled task to automate your workflows</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-sky-600 hover:bg-sky-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Cron Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <CardTitle className="text-white flex items-center">
                          {getStatusIcon(job.status)}
                          <span className="ml-2">{job.name}</span>
                        </CardTitle>
                        <p className="text-slate-400 text-sm">
                          {job.projects?.name} • {job.schedule}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(job.status)} text-white`}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Command</p>
                      <p className="text-white font-mono text-sm bg-slate-900 rounded px-2 py-1">
                        {job.command}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Last Run</p>
                      <p className="text-white text-sm">
                        {job.last_run ? new Date(job.last_run).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Next Run</p>
                      <p className="text-white text-sm flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(job.next_run).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Success Rate</p>
                      <p className="text-white text-sm">
                        {job.success_count} / {job.success_count + job.error_count} runs
                      </p>
                    </div>
                  </div>

                  {job.last_output && (
                    <div className="mb-4">
                      <p className="text-slate-400 text-sm mb-1">Last Output</p>
                      <div className="bg-slate-900 rounded px-3 py-2 text-sm text-slate-300 font-mono">
                        {job.last_output}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => runJobNow(job.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run Now
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => toggleJobStatus(job.id, job.status)}
                        variant="outline"
                        className="border-slate-600"
                      >
                        {job.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingJob(job)}
                        className="border-slate-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteJob(job.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CronJobs;
