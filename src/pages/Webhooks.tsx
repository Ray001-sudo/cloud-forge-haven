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
import { 
  Webhook, 
  Copy, 
  Trash2, 
  Play, 
  Plus,
  Eye,
  EyeOff,
  Clock,
  Code,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookRequest {
  id: string;
  method: string;
  url: string;
  headers: any;
  body: string | null;
  ip_address: string;
  user_agent: string;
  response_status: number;
  processed_at: string;
  project_id: string;
  projects?: {
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
  subdomain: string;
}

const Webhooks = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [webhookRequests, setWebhookRequests] = useState<WebhookRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null);
  const [showBody, setShowBody] = useState<Record<string, boolean>>({});
  const [replayUrl, setReplayUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      loadWebhookRequests();
      // Set up real-time subscription for new webhook requests
      const subscription = supabase
        .channel('webhook_requests')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_requests',
          filter: `project_id=eq.${selectedProject}`
        }, (payload) => {
          setWebhookRequests(prev => [payload.new as WebhookRequest, ...prev]);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, subdomain')
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
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookRequests = async () => {
    if (!selectedProject) return;

    try {
      const { data, error } = await supabase
        .from('webhook_requests')
        .select(`
          *,
          projects (
            name
          )
        `)
        .eq('project_id', selectedProject)
        .order('processed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setWebhookRequests((data || []).map(request => ({
        ...request,
        headers: request.headers as Record<string, string>
      })));
    } catch (error) {
      console.error('Error loading webhook requests:', error);
      toast.error('Failed to load webhook requests');
    }
  };

  const generateWebhookUrl = (projectId: string) => {
    return `https://rfkktecqygejiwtcvgld.supabase.co/functions/v1/webhook-handler/${projectId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const clearRequests = async () => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from('webhook_requests')
        .delete()
        .eq('project_id', selectedProject);

      if (error) throw error;

      setWebhookRequests([]);
      toast.success('All requests cleared');
    } catch (error) {
      console.error('Error clearing requests:', error);
      toast.error('Failed to clear requests');
    }
  };

  const toggleBodyVisibility = (requestId: string) => {
    setShowBody(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const replayRequest = async (request: WebhookRequest) => {
    if (!replayUrl) {
      toast.error('Please enter a replay URL');
      return;
    }

    try {
      const response = await fetch(replayUrl, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: request.body || undefined
      });

      if (response.ok) {
        toast.success(`Request replayed to ${replayUrl}`);
      } else {
        toast.error(`Replay failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error replaying request:', error);
      toast.error('Failed to replay request');
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-600';
      case 'POST': return 'bg-blue-600';
      case 'PUT': return 'bg-yellow-600';
      case 'DELETE': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const webhookUrl = selectedProject ? generateWebhookUrl(selectedProject) : '';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Webhook className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Projects Found</h3>
            <p className="text-slate-400">Create a project to start receiving webhooks</p>
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
            <h1 className="text-3xl font-bold text-white">Webhook Tester</h1>
            <p className="text-slate-400 mt-1">Test and debug incoming webhooks</p>
          </div>
          <div className="flex space-x-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={clearRequests} variant="outline" className="border-red-600 text-red-400">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {selectedProjectData && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Webhook className="h-5 w-5 mr-2 text-sky-400" />
                Webhook URL for {selectedProjectData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="flex-1 bg-slate-700 border-slate-600 text-white font-mono"
                />
                <Button
                  onClick={() => copyToClipboard(webhookUrl)}
                  variant="outline"
                  className="border-slate-600"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Send requests to this URL to test your webhooks. All requests will be logged below.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Captured Requests ({webhookRequests.length})
            </h2>
            {webhookRequests.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 text-center py-12">
                <CardContent>
                  <Webhook className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No requests yet</h3>
                  <p className="text-slate-400">Send a request to your webhook URL to see it here</p>
                </CardContent>
              </Card>
            ) : (
              webhookRequests.map((request) => (
                <Card key={request.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getMethodColor(request.method)} text-white`}>
                          {request.method}
                        </Badge>
                        <span className="text-white font-mono">{request.url}</span>
                        <span className="text-slate-400 text-sm flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(request.processed_at).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        size="sm"
                        variant="outline"
                        className="border-slate-600"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          Headers ({Object.keys(request.headers).length})
                        </span>
                        <Button
                          onClick={() => toggleBodyVisibility(request.id)}
                          size="sm"
                          variant="ghost"
                          className="text-slate-400"
                        >
                          {showBody[request.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {showBody[request.id] && (
                        <div className="bg-slate-900 rounded-lg p-3">
                          <pre className="text-xs text-slate-300 overflow-x-auto">
                            {JSON.stringify(request.headers, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="text-sm text-slate-400">
                        Body: {request.body ? `${request.body.length} characters` : 'Empty'}
                      </div>
                      <div className="text-sm text-slate-400">
                        IP: {request.ip_address} • Status: {request.response_status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Play className="h-5 w-5 mr-2 text-green-400" />
                  Replay Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="replay-url" className="text-white">Target URL</Label>
                  <Input
                    id="replay-url"
                    value={replayUrl}
                    onChange={(e) => setReplayUrl(e.target.value)}
                    placeholder="https://api.example.com/webhook"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button
                  onClick={() => selectedRequest && replayRequest(selectedRequest)}
                  disabled={!selectedRequest || !replayUrl}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
                >
                  Replay Selected Request
                </Button>
              </CardContent>
            </Card>

            {selectedRequest && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Code className="h-5 w-5 mr-2 text-purple-400" />
                    Request Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Method & URL</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={`${getMethodColor(selectedRequest.method)} text-white`}>
                        {selectedRequest.method}
                      </Badge>
                      <span className="text-slate-300 font-mono text-sm">{selectedRequest.url}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Headers</Label>
                    <Textarea
                      value={JSON.stringify(selectedRequest.headers, null, 2)}
                      readOnly
                      className="bg-slate-700 border-slate-600 text-white font-mono text-xs mt-1 h-32"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Body</Label>
                    <Textarea
                      value={selectedRequest.body || 'No body'}
                      readOnly
                      className="bg-slate-700 border-slate-600 text-white font-mono text-xs mt-1 h-48"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Request Info</Label>
                    <div className="bg-slate-700 rounded p-3 mt-1">
                      <div className="text-sm text-slate-300 space-y-1">
                        <div>IP Address: {selectedRequest.ip_address}</div>
                        <div>User Agent: {selectedRequest.user_agent}</div>
                        <div>Response Status: {selectedRequest.response_status}</div>
                        <div>Processed: {new Date(selectedRequest.processed_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Webhooks;
