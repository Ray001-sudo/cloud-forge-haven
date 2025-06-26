
-- Create table for terminal command history
CREATE TABLE IF NOT EXISTS public.terminal_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  output TEXT,
  exit_code INTEGER DEFAULT 0,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on terminal_commands
ALTER TABLE public.terminal_commands ENABLE ROW LEVEL SECURITY;

-- Create policy for terminal commands
DROP POLICY IF EXISTS "Users can manage terminal commands for their projects" ON public.terminal_commands;
CREATE POLICY "Users can manage terminal commands for their projects" ON public.terminal_commands
  FOR ALL USING (
    user_id = auth.uid() AND 
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_terminal_commands_project_user ON public.terminal_commands(project_id, user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_build_logs_project_realtime ON public.build_logs(project_id, created_at DESC);

-- Enable real-time for build_logs and terminal_commands
ALTER TABLE public.build_logs REPLICA IDENTITY FULL;
ALTER TABLE public.terminal_commands REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
    -- Add build_logs to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'build_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.build_logs;
    END IF;
    
    -- Add terminal_commands to realtime if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'terminal_commands'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.terminal_commands;
    END IF;
END $$;

-- Function to simulate command execution and store results
CREATE OR REPLACE FUNCTION public.execute_terminal_command(
  p_project_id UUID,
  p_user_id UUID,
  p_command TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  command_parts TEXT[];
  base_command TEXT;
  result_output TEXT;
  exit_code INTEGER := 0;
  command_id UUID;
BEGIN
  -- Parse command
  command_parts := string_to_array(trim(p_command), ' ');
  base_command := command_parts[1];
  
  -- Simulate command execution based on command type
  CASE base_command
    WHEN 'ls' THEN
      result_output := E'package.json\nindex.js\nREADME.md\nsrc/\nlogs/\nnode_modules/';
    WHEN 'pwd' THEN
      result_output := '/home/project';
    WHEN 'whoami' THEN
      result_output := 'cloudforge-user';
    WHEN 'date' THEN
      result_output := to_char(now(), 'Day Mon DD HH24:MI:SS UTC YYYY');
    WHEN 'ps' THEN
      result_output := E'  PID TTY          TIME CMD\n  123 pts/0    00:00:01 node\n  456 pts/0    00:00:00 npm\n  789 pts/0    00:00:00 bash';
    WHEN 'clear' THEN
      result_output := '';
    WHEN 'help' THEN
      result_output := E'Available commands:\n  ls, cd, pwd, cat, touch, mkdir\n  npm, node, python3\n  ps, whoami, date, clear, help, exit';
    ELSE
      result_output := format('bash: %s: command not found', base_command);
      exit_code := 127;
  END CASE;
  
  -- Store command in history
  INSERT INTO public.terminal_commands (project_id, user_id, command, output, exit_code)
  VALUES (p_project_id, p_user_id, p_command, result_output, exit_code)
  RETURNING id INTO command_id;
  
  -- Return result
  RETURN jsonb_build_object(
    'id', command_id,
    'output', result_output,
    'exit_code', exit_code,
    'timestamp', now()
  );
END;
$$;
