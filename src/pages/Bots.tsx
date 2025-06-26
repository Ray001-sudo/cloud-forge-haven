
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bot, 
  Plus, 
  Settings, 
  Trash2, 
  Power,
  PowerOff,
  MessageSquare,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface BotConfig {
  id: string;
  project_id: string;
  user_id: string;
  bot_type: string;
  bot_name: string;
  bot_token: string;
  webhook_secret?: string;
  status: string;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

const Bots = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBot, setShowAddBot] = useState(false);
  const [editingBot, setEditingBot] = useState<BotConfig | null>(null);
  const [showTokens, setShowTokens] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    bot_name: '',
    bot_type: '',
    bot_token: '',
    webhook_secret: ''
  });

  const botTypes = [
    { value: 'telegram', label: 'Telegram', icon: '🤖' },
    { value: 'discord', label: 'Discord', icon: '🎮' },
    { value: 'slack', label: 'Slack', icon: '💬' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '📱' }
  ];

  useEffect(() => {
    if (projectId && user) {
      loadProject();
      loadBots();
    }
  }, [projectId, user]);

  const loadProject = async () => {
    try {
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
      toast.error('Failed to load project');
    }
  };

  const loadBots = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bot_configs')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error loading bots:', error);
      toast.error('Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bot_name || !formData.bot_type || !formData.bot_token) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('bot_configs')
        .insert({
          project_id: projectId,
          user_id: user?.id,
          bot_name: formData.bot_name,
          bot_type: formData.bot_type,
          bot_token: formData.bot_token,
          webhook_secret: formData.webhook_secret || null,
          status: 'inactive'
        });

      if (error) throw error;

      toast.success('Bot added successfully');
      setShowAddBot(false);
      setFormData({ bot_name: '', bot_type: '', bot_token: '', webhook_secret: '' });
      loadBots();
    } catch (error) {
      console.error('Error adding bot:', error);
      toast.error('Failed to add bot');
    }
  };

  const handleUpdateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBot || !formData.bot_name || !formData.bot_type || !formData.bot_token) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('bot_configs')
        .update({
          bot_name: formData.bot_name,
          bot_type: formData.bot_type,
          bot_token: formData.bot_token,
          webhook_secret: formData.webhook_secret || null
        })
        .eq('id', editingBot.id);

      if (error) throw error;

      toast.success('Bot updated successfully');
      setEditingBot(null);
      setFormData({ bot_name: '', bot_type: '', bot_token: '', webhook_secret: '' });
      loadBots();
    } catch (error) {
      console.error('Error updating bot:', error);
      toast.error('Failed to update bot');
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return;

    try {
      const { error } = await supabase
        .from('bot_configs')
        .delete()
        .eq('id', botId);

      if (error) throw error;

      toast.success('Bot deleted successfully');
      loadBots();
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast.error('Failed to delete bot');
    }
  };

  const handleToggleBotStatus = async (bot: BotConfig) => {
    const newStatus = bot.status === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('bot_configs')
        .update({ 
          status: newStatus,
          last_activity: newStatus === 'active' ? new Date().toISOString() : bot.last_activity
        })
        .eq('id', bot.id);

      if (error) throw error;

      toast.success(`Bot ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      loadBots();
    } catch (error) {
      console.error('Error toggling bot status:', error);
      toast.error('Failed to update bot status');
    }
  };

  const toggleTokenVisibility = (botId: string) => {
    setShowTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(botId)) {
        newSet.delete(botId);
      } else {
        newSet.add(botId);
      }
      return newSet;
    });
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return '*'.repeat(token.length);
    return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
  };

  const getBotTypeIcon = (type: string) => {
    const botType = botTypes.find(bt => bt.value === type);
    return botType?.icon || '🤖';
  };

  const openAddDialog = () => {
    setFormData({ bot_name: '', bot_type: '', bot_token: '', webhook_secret: '' });
    setShowAddBot(true);
  };

  const openEditDialog = (bot: BotConfig) => {
    setFormData({
      bot_name: bot.bot_name,
      bot_type: bot.bot_type,
      bot_token: bot.bot_token,
      webhook_secret: bot.webhook_secret || ''
    });
    setEditingBot(bot);
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
            <h1 className="text-3xl font-bold text-white">Bot Configurations</h1>
            <p className="text-slate-400 mt-1">
              Manage chatbots and automation for {project.name}
            </p>
          </div>
          <Dialog open={showAddBot} onOpenChange={setShowAddBot}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-sky-600 hover:bg-sky-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Bot</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBot} className="space-y-4">
                <div>
                  <Label htmlFor="bot_name" className="text-white">Bot Name</Label>
                  <Input
                    id="bot_name"
                    value={formData.bot_name}
                    onChange={(e) => setFormData({...formData, bot_name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="My Awesome Bot"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="bot_type" className="text-white">Bot Type</Label>
                  <Select value={formData.bot_type} onValueChange={(value) => setFormData({...formData, bot_type: value})} required>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select bot type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {botTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="bot_token" className="text-white">Bot Token</Label>
                  <Input
                    id="bot_token"
                    type="password"
                    value={formData.bot_token}
                    onChange={(e) => setFormData({...formData, bot_token: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter bot token"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="webhook_secret" className="text-white">Webhook Secret (Optional)</Label>
                  <Input
                    id="webhook_secret"
                    value={formData.webhook_secret}
                    onChange={(e) => setFormData({...formData, webhook_secret: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Optional webhook secret"
                  />
                </div>
                
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">
                  Add Bot
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bot List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.length === 0 ? (
            <Card className="col-span-full bg-slate-800 border-slate-700">
              <CardContent className="text-center py-12">
                <Bot className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No bots configured</h3>
                <p className="text-slate-400 mb-4">
                  Add your first bot to start automating your project
                </p>
                <Button onClick={openAddDialog} className="bg-sky-600 hover:bg-sky-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bot
                </Button>
              </CardContent>
            </Card>
          ) : (
            bots.map((bot) => (
              <Card key={bot.id} className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getBotTypeIcon(bot.bot_type)}</div>
                    <div>
                      <CardTitle className="text-white text-lg">{bot.bot_name}</CardTitle>
                      <p className="text-sm text-slate-400 capitalize">{bot.bot_type}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={bot.status === 'active' ? 'default' : 'secondary'}
                    className={bot.status === 'active' ? 'bg-green-600' : ''}
                  >
                    {bot.status}
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-slate-400">Token</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="flex-1 bg-slate-900 px-2 py-1 rounded text-xs text-slate-300">
                        {showTokens.has(bot.id) ? bot.bot_token : maskToken(bot.bot_token)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleTokenVisibility(bot.id)}
                        className="text-slate-400"
                      >
                        {showTokens.has(bot.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {bot.last_activity && (
                    <div>
                      <Label className="text-sm text-slate-400">Last Activity</Label>
                      <p className="text-sm text-slate-300 mt-1">
                        {new Date(bot.last_activity).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleToggleBotStatus(bot)}
                      className={`flex-1 ${
                        bot.status === 'active' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {bot.status === 'active' ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(bot)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBot(bot.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Bot Dialog */}
        <Dialog open={!!editingBot} onOpenChange={() => setEditingBot(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Bot Configuration</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateBot} className="space-y-4">
              <div>
                <Label htmlFor="edit_bot_name" className="text-white">Bot Name</Label>
                <Input
                  id="edit_bot_name"
                  value={formData.bot_name}
                  onChange={(e) => setFormData({...formData, bot_name: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_bot_type" className="text-white">Bot Type</Label>
                <Select value={formData.bot_type} onValueChange={(value) => setFormData({...formData, bot_type: value})} required>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {botTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_bot_token" className="text-white">Bot Token</Label>
                <Input
                  id="edit_bot_token"
                  type="password"
                  value={formData.bot_token}
                  onChange={(e) => setFormData({...formData, bot_token: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_webhook_secret" className="text-white">Webhook Secret (Optional)</Label>
                <Input
                  id="edit_webhook_secret"
                  value={formData.webhook_secret}
                  onChange={(e) => setFormData({...formData, webhook_secret: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">
                Update Bot
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Bots;
