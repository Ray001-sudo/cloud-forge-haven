
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Webhook, 
  Copy, 
  Trash2, 
  Play, 
  Plus,
  Eye,
  EyeOff,
  Clock,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
  ip: string;
}

const Webhooks = () => {
  const [webhookUrl] = useState('https://webhook.cloudforge.app/u/user123/endpoint1');
  const [requests, setRequests] = useState<WebhookRequest[]>([
    {
      id: '1',
      method: 'POST',
      url: '/webhook',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Hookshot/abc123',
        'X-GitHub-Event': 'push'
      },
      body: JSON.stringify({
        ref: 'refs/heads/main',
        repository: {
          name: 'my-repo',
          full_name: 'user/my-repo'
        },
        pusher: {
          name: 'john-doe',
          email: 'john@example.com'
        }
      }, null, 2),
      timestamp: '2024-01-15T10:30:00Z',
      ip: '192.30.252.1'
    },
    {
      id: '2',
      method: 'POST',
      url: '/webhook',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Stripe/1.0',
        'Stripe-Signature': 'v1=abc123def456'
      },
      body: JSON.stringify({
        id: 'evt_1234567890',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_1234567890',
            amount: 2000,
            currency: 'usd',
            status: 'succeeded'
          }
        }
      }, null, 2),
      timestamp: '2024-01-15T10:25:00Z',
      ip: '54.187.174.169'
    }
  ]);
  
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null);
  const [showBody, setShowBody] = useState<Record<string, boolean>>({});
  const [replayUrl, setReplayUrl] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generateNewUrl = () => {
    const newUrl = `https://webhook.cloudforge.app/u/user123/endpoint${Date.now()}`;
    toast.success('New webhook URL generated');
  };

  const clearRequests = () => {
    setRequests([]);
    toast.success('All requests cleared');
  };

  const toggleBodyVisibility = (requestId: string) => {
    setShowBody(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const replayRequest = (request: WebhookRequest) => {
    if (!replayUrl) {
      toast.error('Please enter a replay URL');
      return;
    }
    toast.success(`Request replayed to ${replayUrl}`);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Webhook Tester</h1>
            <p className="text-slate-400 mt-1">Test and debug incoming webhooks</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={generateNewUrl} variant="outline" className="border-slate-600">
              <Plus className="h-4 w-4 mr-2" />
              New URL
            </Button>
            <Button onClick={clearRequests} variant="outline" className="border-red-600 text-red-400">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Webhook className="h-5 w-5 mr-2 text-sky-400" />
              Your Webhook URL
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white">Captured Requests ({requests.length})</h2>
            {requests.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 text-center py-12">
                <CardContent>
                  <Webhook className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No requests yet</h3>
                  <p className="text-slate-400">Send a request to your webhook URL to see it here</p>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
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
                          {new Date(request.timestamp).toLocaleString()}
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
                        <span className="text-sm text-slate-400">Headers ({Object.keys(request.headers).length})</span>
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
                        IP: {request.ip}
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
