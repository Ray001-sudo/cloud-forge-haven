
import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  command: string;
  projectId: string;
  projectName: string;
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  nextRun: string;
  lastOutput?: string;
  successCount: number;
  errorCount: number;
}

const CronJobs = () => {
  const [jobs, setJobs] = useState<CronJob[]>([
    {
      id: '1',
      name: 'Daily Backup',
      schedule: '0 2 * * *',
      command: 'python backup.py',
      projectId: 'proj1',
      projectName: 'my-web-app',
      status: 'active',
      lastRun: '2024-01-15T02:00:00Z',
      nextRun: '2024-01-16T02:00:00Z',
      lastOutput: 'Backup completed successfully',
      successCount: 15,
      errorCount: 0
    },
    {
      id: '2',
      name: 'Send Reports',
      schedule: '0 9 * * 1',
      command: 'node send-reports.js',
      projectId: 'proj2',
      projectName: 'telegram-bot',
      status: 'active',
      lastRun: '2024-01-08T09:00:00Z',
      nextRun: '2024-01-15T09:00:00Z',
      lastOutput: 'Reports sent to 50 users',
      successCount: 8,
      errorCount: 1
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [newJob, setNewJob] = useState({
    name: '',
    schedule: '',
    command: '',
    projectId: '',
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

  const projects = [
    { id: 'proj1', name: 'my-web-app' },
    { id: 'proj2', name: 'telegram-bot' },
    { id: 'proj3', name: 'api-service' }
  ];

  const handleCreateJob = () => {
    if (!newJob.name || !newJob.schedule || !newJob.command || !newJob.projectId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const job: CronJob = {
      id: Date.now().toString(),
      name: newJob.name,
      schedule: newJob.schedule,
      command: newJob.command,
      projectId: newJob.projectId,
      projectName: projects.find(p => p.id === newJob.projectId)?.name || '',
      status: 'active',
      nextRun: new Date(Date.now() + 3600000).toISOString(), // Next hour
      successCount: 0,
      errorCount: 0
    };

    setJobs([...jobs, job]);
    setNewJob({ name: '', schedule: '', command: '', projectId: '', quickSchedule: '' });
    setIsCreateDialogOpen(false);
    toast.success('Cron job created successfully');
  };

  const toggleJobStatus = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: job.status === 'active' ? 'paused' : 'active' }
        : job
    ));
    toast.success('Job status updated');
  };

  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    toast.success('Cron job deleted');
  };

  const runJobNow = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { 
              ...j, 
              lastRun: new Date().toISOString(),
              lastOutput: 'Manual execution completed',
              successCount: j.successCount + 1
            }
          : j
      ));
      toast.success(`Executed: ${job.name}`);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Cron Jobs</h1>
            <p className="text-slate-400 mt-1">Schedule and manage automated tasks</p>
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
                    <Select value={newJob.projectId} onValueChange={(value) => setNewJob({...newJob, projectId: value})}>
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
                  <Button onClick={handleCreateJob} className="bg-sky-600 hover:bg-sky-700">
                    <Clock className="mr-2 h-4 w-4" />
                    Create Job
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
                          {job.projectName} • {job.schedule}
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
                        {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Next Run</p>
                      <p className="text-white text-sm flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(job.nextRun).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Success Rate</p>
                      <p className="text-white text-sm">
                        {job.successCount} / {job.successCount + job.errorCount} runs
                      </p>
                    </div>
                  </div>

                  {job.lastOutput && (
                    <div className="mb-4">
                      <p className="text-slate-400 text-sm mb-1">Last Output</p>
                      <div className="bg-slate-900 rounded px-3 py-2 text-sm text-slate-300 font-mono">
                        {job.lastOutput}
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
                        onClick={() => toggleJobStatus(job.id)}
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
