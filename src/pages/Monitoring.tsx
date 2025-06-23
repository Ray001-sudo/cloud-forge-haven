
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Monitoring = () => {
  const [selectedProject, setSelectedProject] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  // Mock data for charts
  const cpuData = [
    { time: '00:00', value: 12 },
    { time: '04:00', value: 8 },
    { time: '08:00', value: 25 },
    { time: '12:00', value: 45 },
    { time: '16:00', value: 35 },
    { time: '20:00', value: 20 },
    { time: '24:00', value: 15 }
  ];

  const memoryData = [
    { time: '00:00', used: 180, total: 512 },
    { time: '04:00', used: 150, total: 512 },
    { time: '08:00', used: 220, total: 512 },
    { time: '12:00', used: 380, total: 512 },
    { time: '16:00', used: 340, total: 512 },
    { time: '20:00', used: 280, total: 512 },
    { time: '24:00', used: 200, total: 512 }
  ];

  const requestsData = [
    { time: '00:00', requests: 120 },
    { time: '04:00', requests: 80 },
    { time: '08:00', requests: 300 },
    { time: '12:00', requests: 450 },
    { time: '16:00', requests: 380 },
    { time: '20:00', requests: 250 },
    { time: '24:00', requests: 180 }
  ];

  const responseTimeData = [
    { time: '00:00', p50: 120, p95: 280, p99: 450 },
    { time: '04:00', p50: 110, p95: 250, p99: 400 },
    { time: '08:00', p50: 140, p95: 320, p99: 500 },
    { time: '12:00', p50: 180, p95: 380, p99: 600 },
    { time: '16:00', p50: 160, p95: 350, p99: 550 },
    { time: '20:00', p50: 130, p95: 300, p99: 480 },
    { time: '24:00', p50: 125, p95: 290, p99: 460 }
  ];

  const statusCodesData = [
    { name: '2xx', value: 85, color: '#22c55e' },
    { name: '4xx', value: 12, color: '#f59e0b' },
    { name: '5xx', value: 3, color: '#ef4444' }
  ];

  const projects = [
    { id: 'all', name: 'All Projects' },
    { id: 'proj1', name: 'my-web-app' },
    { id: 'proj2', name: 'telegram-bot' },
    { id: 'proj3', name: 'api-service' }
  ];

  const alerts = [
    {
      id: '1',
      type: 'warning',
      title: 'High Memory Usage',
      description: 'my-web-app is using 85% of allocated memory',
      timestamp: '5 minutes ago',
      project: 'my-web-app'
    },
    {
      id: '2',
      type: 'error',
      title: 'Service Down',
      description: 'telegram-bot has been unreachable for 2 minutes',
      timestamp: '2 minutes ago',
      project: 'telegram-bot'
    },
    {
      id: '3',
      type: 'success',
      title: 'Deployment Complete',
      description: 'api-service v1.2.0 deployed successfully',
      timestamp: '10 minutes ago',
      project: 'api-service'
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <Activity className="h-4 w-4 text-blue-400" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-600 bg-red-900/20';
      case 'warning': return 'border-yellow-600 bg-yellow-900/20';
      case 'success': return 'border-green-600 bg-green-900/20';
      default: return 'border-blue-600 bg-blue-900/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Monitoring</h1>
            <p className="text-slate-400 mt-1">Real-time performance metrics and alerts</p>
          </div>
          <div className="flex space-x-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
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
              <div className="text-2xl font-bold text-white">23.5%</div>
              <p className="text-sm text-slate-400">Average across all projects</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+2.1% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Server className="h-5 w-5 mr-2 text-blue-400" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1.2GB</div>
              <p className="text-sm text-slate-400">of 4GB allocated</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Globe className="h-5 w-5 mr-2 text-purple-400" />
                Requests/min
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">247</div>
              <p className="text-sm text-slate-400">Last 5 minutes</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+15% from last hour</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">142ms</div>
              <p className="text-sm text-slate-400">95th percentile</p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-sm">Within SLA</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">CPU Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="used" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Request Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={requestsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="requests" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Status Code Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusCodesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusCodesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-4">
                {statusCodesData.map((entry) => (
                  <div key={entry.name} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-300">
                      {entry.name}: {entry.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <h4 className="text-white font-medium">{alert.title}</h4>
                          <p className="text-slate-300 text-sm">{alert.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {alert.project}
                            </Badge>
                            <span className="text-slate-400 text-xs flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {alert.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-slate-400">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Monitoring;
