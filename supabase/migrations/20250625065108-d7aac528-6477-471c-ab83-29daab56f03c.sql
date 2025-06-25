
-- Create table for real resource usage tracking
CREATE TABLE public.resource_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  cpu_usage DECIMAL(5,2) NOT NULL DEFAULT 0,
  memory_usage INTEGER NOT NULL DEFAULT 0, -- in MB
  disk_usage INTEGER NOT NULL DEFAULT 0, -- in MB
  network_in INTEGER NOT NULL DEFAULT 0, -- in MB
  network_out INTEGER NOT NULL DEFAULT 0, -- in MB
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for real cron jobs
CREATE TABLE public.cron_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  schedule TEXT NOT NULL, -- cron expression
  command TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE NOT NULL,
  last_output TEXT,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for real webhook requests
CREATE TABLE public.webhook_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  headers JSONB NOT NULL DEFAULT '{}',
  body TEXT,
  ip_address INET,
  user_agent TEXT,
  response_status INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for build logs and container logs
CREATE TABLE public.build_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  deployment_id UUID REFERENCES public.deployments(id) ON DELETE CASCADE,
  log_level TEXT NOT NULL DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'build', -- 'build', 'runtime', 'system'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to projects table for real container management
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS container_id TEXT,
ADD COLUMN IF NOT EXISTS docker_image TEXT,
ADD COLUMN IF NOT EXISTS port INTEGER DEFAULT 3000,
ADD COLUMN IF NOT EXISTS cpu_limit DECIMAL(3,1) DEFAULT 0.5, -- CPU cores
ADD COLUMN IF NOT EXISTS ram_limit INTEGER DEFAULT 256, -- MB
ADD COLUMN IF NOT EXISTS disk_limit INTEGER DEFAULT 1024, -- MB
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS ssl_enabled BOOLEAN DEFAULT false;

-- Add missing columns to deployments table
ALTER TABLE public.deployments
ADD COLUMN IF NOT EXISTS build_duration INTEGER, -- seconds
ADD COLUMN IF NOT EXISTS build_status TEXT DEFAULT 'pending' CHECK (build_status IN ('pending', 'building', 'success', 'failed')),
ADD COLUMN IF NOT EXISTS deployment_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resource_usage_project_time ON public.resource_usage(project_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_next_run ON public.cron_jobs(next_run) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_webhook_requests_project ON public.webhook_requests(project_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_build_logs_project ON public.build_logs(project_id, created_at DESC);

-- Enable RLS on all new tables
ALTER TABLE public.resource_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resource_usage
CREATE POLICY "Users can view their project resource usage" 
  ON public.resource_usage FOR SELECT 
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "System can insert resource usage" 
  ON public.resource_usage FOR INSERT 
  WITH CHECK (true); -- Allow system to insert usage data

-- Create RLS policies for cron_jobs
CREATE POLICY "Users can manage their project cron jobs" 
  ON public.cron_jobs FOR ALL 
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Create RLS policies for webhook_requests
CREATE POLICY "Users can view their project webhook requests" 
  ON public.webhook_requests FOR SELECT 
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "System can insert webhook requests" 
  ON public.webhook_requests FOR INSERT 
  WITH CHECK (true); -- Allow webhook system to insert requests

-- Create RLS policies for build_logs
CREATE POLICY "Users can view their project build logs" 
  ON public.build_logs FOR SELECT 
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "System can insert build logs" 
  ON public.build_logs FOR INSERT 
  WITH CHECK (true); -- Allow build system to insert logs

-- Function to calculate next cron run time
CREATE OR REPLACE FUNCTION calculate_next_cron_run(cron_expression TEXT, from_time TIMESTAMP WITH TIME ZONE DEFAULT now())
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Simple cron parser - in production you'd use a proper cron library
  -- For now, handle basic patterns
  CASE 
    WHEN cron_expression = '* * * * *' THEN -- every minute
      next_run := date_trunc('minute', from_time) + interval '1 minute';
    WHEN cron_expression = '*/5 * * * *' THEN -- every 5 minutes
      next_run := date_trunc('hour', from_time) + 
                  (extract(minute from from_time)::int / 5 + 1) * interval '5 minutes';
    WHEN cron_expression = '0 * * * *' THEN -- every hour
      next_run := date_trunc('hour', from_time) + interval '1 hour';
    WHEN cron_expression = '0 0 * * *' THEN -- daily at midnight
      next_run := date_trunc('day', from_time) + interval '1 day';
    WHEN cron_expression = '0 9 * * *' THEN -- daily at 9 AM
      next_run := date_trunc('day', from_time) + interval '9 hours';
      IF next_run <= from_time THEN
        next_run := next_run + interval '1 day';
      END IF;
    WHEN cron_expression = '0 9 * * 1' THEN -- weekly on Monday at 9 AM
      next_run := date_trunc('week', from_time) + interval '9 hours';
      IF next_run <= from_time THEN
        next_run := next_run + interval '1 week';
      END IF;
    ELSE -- default to hourly if unknown pattern
      next_run := date_trunc('hour', from_time) + interval '1 hour';
  END CASE;
  
  RETURN next_run;
END;
$$;

-- Trigger to auto-generate subdomain for projects
CREATE OR REPLACE FUNCTION generate_project_subdomain()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.subdomain IS NULL THEN
    NEW.subdomain := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]', '-', 'g'));
    -- Ensure uniqueness by appending random suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.projects WHERE subdomain = NEW.subdomain AND id != NEW.id) LOOP
      NEW.subdomain := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_subdomain
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION generate_project_subdomain();

-- Function to update cron job next_run times
CREATE OR REPLACE FUNCTION update_cron_next_run()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.next_run := calculate_next_cron_run(NEW.schedule);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_cron_next_run
  BEFORE INSERT OR UPDATE ON public.cron_jobs
  FOR EACH ROW EXECUTE FUNCTION update_cron_next_run();
