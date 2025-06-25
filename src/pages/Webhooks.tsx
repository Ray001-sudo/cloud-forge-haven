
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Activity, 
  Clock, 
  RefreshCw, 
  Filter,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookRequest {
  id: string;
  project_id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  ip_address?: string;
  user_agent?: string;
  response_status?: number;
  processed_at: string;
  projects?: {
    name: string;
    subdomain: string;
  };
}

const Webhooks = () => {
  const { user } = useAuth();
  const [webhookRequests, setWebhookRequests] = useState<WebhookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (user) {
      loadWebhookRequests();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('webhook_requests')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_requests'
        }, (payload) => {
          loadWebhookRequests(); // Reload to get project info
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadWebhookRequests = async () => {
    try {
      setLoading(true);
      
      // Get user's projects first
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user?.id);

      if (projectsError) throw projectsError;

      if (!projects || projects.length === 0) {
        setWebhookRequests([]);
        return;
      }

      const projectIds = projects.map(p => p.id);

      // Get webhook requests for user's projects
      const { data, error } = await supabase
        .from('webhook_requests')
        .select(`
          *,
          projects!inner (
            name,
            subdomain
          )
        `)
        .in('project_id', projectIds)
        .order('processed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        project_id: item.project_id,
        method: item.method,
        url: item.url,
        headers: typeof item.headers === 'object' ? item.headers as Record<string, string> : {},
        body: item.body || undefined,
        ip_address: item.ip_address ? String(item.ip_address) : undefined,
        user_agent: item.user_agent || undefined,
        response_status: item.response_status || undefined,
        processed_at: item.processed_at,
        projects: {
          name: item.projects.name,
          subdomain: item.projects.subdomain
        }
      })) || [];

      setWebhookRequests(transformedData);
    } catch (error) {
      console.error('Error loading webhook requests:', error);
      toast.error('Failed to load webhook requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-600';
    if (status >= 200 && status < 300) return 'bg-green-600';
    if (status >= 400 && status < 500) return 'bg-yellow-600';
    if (status >= 500) return 'bg-red-600';
    return 'bg-gray-600';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'text-green-400';
      case 'POST': return 'text-blue-400';
      case 'PUT': return 'text-yellow-400';
      case 'DELETE': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const filteredRequests = webhookRequests.filter(request =>
    request.url.toLowerCase().includes(filter.toLowerCase()) ||
    request.method.toLowerCase().includes(filter.toLowerCase()) ||
    request.projects?.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Webhooks</h1>
            <p className="text-slate-400 mt-1">
              Monitor incoming webhook requests to your projects
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Filter webhooks..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button
              onClick={loadWebhookRequests}
              variant="outline"
              className="border-slate-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading webhook requests...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <Globe className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No webhook requests</h3>
              <p className="text-slate-400">
                {webhookRequests.length === 0 
                  ? "No webhook requests have been received yet." 
                  : "No webhook requests match your filter criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={getMethodColor(request.method)}>
                          {request.method}
                        </Badge>
                        {request.response_status && (
                          <Badge className={`${getStatusColor(request.response_status)} text-white`}>
                            {request.response_status}
                          </Badge>
                        )}
                        <span className="text-slate-400 text-sm">
                          {request.projects?.name}
                        </span>
                      </div>
                      
                      <div className="font-mono text-sm text-slate-300 mb-2">
                        {request.url}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(request.processed_at).toLocaleString()}
                        </div>
                        {request.ip_address && (
                          <div>IP: {request.ip_address}</div>
                        )}
                        {request.user_agent && (
                          <div className="truncate max-w-xs">
                            {request.user_agent}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {request.projects?.subdomain && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://${request.projects.subdomain}.cloudforge.dev`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {request.body && (
                    <div className="mt-4 p-3 bg-slate-900 rounded-lg">
                      <div className="text-sm text-slate-400 mb-2">Request Body:</div>
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        {request.body.length > 500 
                          ? `${request.body.substring(0, 500)}...` 
                          : request.body}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Webhooks;
