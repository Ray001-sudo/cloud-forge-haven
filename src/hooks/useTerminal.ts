
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  exit_code: number;
  executed_at: string;
}

export interface BuildLog {
  id: string;
  message: string;
  log_level: string;
  source: string;
  created_at: string;
}

interface CommandExecutionResult {
  id: string;
  output: string;
  exit_code: number;
  timestamp: string;
}

export const useTerminal = (projectId: string) => {
  const { user } = useAuth();
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load command history
  const loadCommandHistory = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('terminal_commands')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCommandHistory(data || []);
    } catch (error) {
      console.error('Error loading command history:', error);
    }
  }, [user, projectId]);

  // Load build logs
  const loadBuildLogs = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('build_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setBuildLogs(data || []);
    } catch (error) {
      console.error('Error loading build logs:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Execute command
  const executeCommand = useCallback(async (command: string): Promise<{ output: string; exit_code: number }> => {
    if (!user || !projectId) {
      return { output: 'Error: User not authenticated', exit_code: 1 };
    }

    try {
      const { data, error } = await supabase.rpc('execute_terminal_command', {
        p_project_id: projectId,
        p_user_id: user.id,
        p_command: command
      });

      if (error) throw error;

      // Fix TypeScript error with proper type assertion
      const result = data as unknown as CommandExecutionResult;

      return {
        output: result.output || '',
        exit_code: result.exit_code || 0
      };
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        exit_code: 1
      };
    }
  }, [user, projectId]);

  // Clear command history
  const clearCommandHistory = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      const { error } = await supabase
        .from('terminal_commands')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCommandHistory([]);
    } catch (error) {
      console.error('Error clearing command history:', error);
    }
  }, [user, projectId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!projectId) return;

    // Subscribe to new build logs
    const buildLogsChannel = supabase
      .channel('build_logs_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'build_logs',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        setBuildLogs(prev => [payload.new as BuildLog, ...prev]);
      })
      .subscribe();

    // Subscribe to new terminal commands
    const commandsChannel = supabase
      .channel('terminal_commands_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'terminal_commands',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        setCommandHistory(prev => [payload.new as TerminalCommand, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(buildLogsChannel);
      supabase.removeChannel(commandsChannel);
    };
  }, [projectId]);

  // Load initial data
  useEffect(() => {
    if (user && projectId) {
      loadCommandHistory();
      loadBuildLogs();
    }
  }, [user, projectId, loadCommandHistory, loadBuildLogs]);

  return {
    commandHistory,
    buildLogs,
    loading,
    executeCommand,
    loadCommandHistory,
    loadBuildLogs,
    clearCommandHistory
  };
};
