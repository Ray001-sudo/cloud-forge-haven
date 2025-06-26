
-- Create bot_configs table
CREATE TABLE IF NOT EXISTS public.bot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_type TEXT NOT NULL CHECK (bot_type IN ('telegram', 'discord', 'slack', 'whatsapp')),
  bot_name TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  webhook_secret TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table for billing
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'mpesa')),
  payment_provider_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  plan_name TEXT NOT NULL,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_history table
CREATE TABLE IF NOT EXISTS public.billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_files table for file management
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, file_path)
);

-- Create storage bucket for project files (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'project-files', 'project-files', false, 52428800, ARRAY['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-files');

-- Enable RLS on new tables
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can manage their own bot configs" ON public.bot_configs;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own billing history" ON public.billing_history;
DROP POLICY IF EXISTS "Users can insert their own billing history" ON public.billing_history;
DROP POLICY IF EXISTS "Users can manage files in their projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage cron jobs for their projects" ON public.cron_jobs;
DROP POLICY IF EXISTS "Users can view build logs for their projects" ON public.build_logs;
DROP POLICY IF EXISTS "System can manage build logs" ON public.build_logs;
DROP POLICY IF EXISTS "Users can view webhook requests for their projects" ON public.webhook_requests;
DROP POLICY IF EXISTS "System can manage webhook requests" ON public.webhook_requests;
DROP POLICY IF EXISTS "Users can view resource usage for their projects" ON public.resource_usage;
DROP POLICY IF EXISTS "System can manage resource usage" ON public.resource_usage;

-- RLS Policies for bot_configs
CREATE POLICY "Users can manage their own bot configs" ON public.bot_configs
  FOR ALL USING (
    user_id = auth.uid() OR 
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payments" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for billing_history
CREATE POLICY "Users can view their own billing history" ON public.billing_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own billing history" ON public.billing_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for project_files
CREATE POLICY "Users can manage files in their projects" ON public.project_files
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- RLS Policies for projects
CREATE POLICY "Users can manage their own projects" ON public.projects
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for cron_jobs
CREATE POLICY "Users can manage cron jobs for their projects" ON public.cron_jobs
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- RLS Policies for build_logs
CREATE POLICY "Users can view build logs for their projects" ON public.build_logs
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage build logs" ON public.build_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for webhook_requests
CREATE POLICY "Users can view webhook requests for their projects" ON public.webhook_requests
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage webhook requests" ON public.webhook_requests
  FOR INSERT WITH CHECK (true);

-- RLS Policies for resource_usage
CREATE POLICY "Users can view resource usage for their projects" ON public.resource_usage
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage resource usage" ON public.resource_usage
  FOR INSERT WITH CHECK (true);

-- Storage policies for project files
DROP POLICY IF EXISTS "Users can upload files to their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files from their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from their projects" ON storage.objects;

CREATE POLICY "Users can upload files to their projects" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view files from their projects" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files in their projects" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files from their projects" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Update profiles table to include subscription_tier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite'));

-- Add updated_at trigger for bot_configs
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bot_configs_updated_at ON public.bot_configs;
CREATE TRIGGER bot_configs_updated_at 
  BEFORE UPDATE ON public.bot_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS project_files_updated_at ON public.project_files;
CREATE TRIGGER project_files_updated_at 
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
