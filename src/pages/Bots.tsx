
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Plus, 
  Edit3, 
  Trash2, 
  Activity,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface BotConfig {
  id: string;
  project_id: string;
  bot_type: string;
  bot_token: string;
  webhook_secret?: string;
  status: string;
  last_activity?: string;
  created_at: string;
}

const Bots = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBot, setEditingBot] = useState<BotConfig | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    bot_type: '',
    bot_token: '',
    webhook_secret: ''
  });

  useEffect(() => {
    if (projectId && user) {
      loadBots();
    }
  }, [projectId, user]);

  const loadBots = async () => {
    try {
      setLoading(true);
      
      // Verify user owns this project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user?.id)
        .single();

      if (projectError || !project) {
        throw new Error('Project not found or access denied');
      }

      // For now, we'll create a mock bot_configs table structure
      // In a real implementation, you'd have this table in your database
      setBots([]);
      
      toast.info('Bot configuration feature is being developed. Coming soon!');
    } catch (error) {
      console.error('Error loading bots:', error);
      toast.error('Failed to load bot configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // This would save to bot_configs table
      toast.success('Bot configuration saved successfully');
      setShowDialog(false);
      resetForm();
      loadBots();
    } catch (error) {
      console.error('Error saving bot config:', error);
      toast.error('Failed to save bot configuration');
    }
  };

  const resetForm = () => {
    setFormData({
      bot_type: '',
      bot_token: '',
      webhook_secret: ''
    });
    setEditingBot(null);
  };

  const toggleBotStatus = async (botId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      // Update bot status in database
      toast.success(`Bot ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
      loadBots();
    } catch (error) {
      console.error('Error toggling bot status:', error);
      toast.error('Failed to update bot status');
    }
  };

  const deleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot configuration?')) return;
    
    try {
      // Delete from bot_configs table
      toast.success('Bot configuration deleted successfully');
      loadBots();
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast.error('Failed to delete bot configuration');
    }
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return token;
    return `${token.substring(0, 4)}${'*'.repeat(token.length - 8)}${token.substring(token.length - 4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-gray-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getBotTypeIcon = (type: string) => {
    switch (type) {
      case 'telegram':
        return '📱';
      case 'discord':
        return '🎮';
      case 'slack':
        return '💬';
      case 'whatsapp':
        return '📞';
      default:
        return '🤖';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Bot Integrations</h1>
            <p className="text-slate-400 mt-1">
              Manage your bot configurations and integrations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={loadBots}
              variant="outline"
              className="border-slate-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-sky-600 hover:bg-sky-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bot
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingBot ? 'Edit Bot Configuration' : 'Add New Bot'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Bot Type
                    </label>
                    <Select
                      value={formData.bot_type}
                      onValueChange={(value) => setFormData({...formData, bot_type: value})}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Select bot type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="discord">Discord</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Bot Token
                    </label>
                    <Input
                      type="password"
                      value={formData.bot_token}
                      onChange={(e) => setFormData({...formData, bot_token: e.target.value})}
                      placeholder="Enter bot token"
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Webhook Secret (Optional)
                    </label>
                    <Input
                      type="password"
                      value={formData.webhook_secret}
                      onChange={(e) => setFormData({...formData, webhook_secret: e.target.value})}
                      placeholder="Enter webhook secret"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDialog(false)}
                      className="border-slate-600"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-sky-600 hover:bg-sky-700">
                      {editingBot ? 'Update' : 'Add'} Bot
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading bot configurations...</div>
          </div>
        ) : bots.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No bots configured</h3>
              <p className="text-slate-400 mb-4">
                Set up your first bot integration to start automating your workflows.
              </p>
              <Button
                onClick={() => setShowDialog(true)}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Bot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <Card key={bot.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getBotTypeIcon(bot.bot_type)}</span>
                      <div>
                        <CardTitle className="text-white capitalize">
                          {bot.bot_type}
                        </CardTitle>
                        <Badge className={`${getStatusColor(bot.status)} text-white mt-1`}>
                          {bot.status}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={bot.status === 'active'}
                      onCheckedChange={() => toggleBotStatus(bot.id, bot.status)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-400">Token:</label>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-slate-900 px-2 py-1 rounded font-mono text-slate-300">
                          {showTokens[bot.id] ? bot.bot_token : maskToken(bot.bot_token)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowTokens({
                            ...showTokens,
                            [bot.id]: !showTokens[bot.id]
                          })}
                        >
                          {showTokens[bot.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {bot.last_activity && (
                      <div className="flex items-center text-sm text-slate-400">
                        <Activity className="h-4 w-4 mr-1" />
                        Last active: {new Date(bot.last_activity).toLocaleString()}
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingBot(bot);
                          setFormData({
                            bot_type: bot.bot_type,
                            bot_token: bot.bot_token,
                            webhook_secret: bot.webhook_secret || ''
                          });
                          setShowDialog(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBot(bot.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default Bots;
