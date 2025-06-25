
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, projectId, userId, buildConfig } = await req.json();

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response = { message: 'Action completed successfully' };

    switch (action) {
      case 'build':
        // Log build start
        await supabase.from('build_logs').insert({
          project_id: projectId,
          message: 'Starting build process...',
          log_level: 'info',
          source: 'build'
        });

        // Simulate build process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update project with build completion
        await supabase
          .from('projects')
          .update({
            docker_image: `${project.name}:latest`,
            container_status: 'stopped',
            last_deployed_at: new Date().toISOString()
          })
          .eq('id', projectId);

        await supabase.from('build_logs').insert({
          project_id: projectId,
          message: 'Build completed successfully',
          log_level: 'info',
          source: 'build'
        });

        response.message = 'Build completed successfully';
        break;

      case 'start':
        if (!project.docker_image) {
          throw new Error('No Docker image found. Please build the project first.');
        }

        // Simulate container start
        await supabase
          .from('projects')
          .update({
            container_status: 'running',
            container_id: `container_${projectId}_${Date.now()}`
          })
          .eq('id', projectId);

        await supabase.from('build_logs').insert({
          project_id: projectId,
          message: 'Container started successfully',
          log_level: 'info',
          source: 'runtime'
        });

        response.message = 'Container started successfully';
        break;

      case 'stop':
        await supabase
          .from('projects')
          .update({
            container_status: 'stopped',
            container_id: null
          })
          .eq('id', projectId);

        await supabase.from('build_logs').insert({
          project_id: projectId,
          message: 'Container stopped',
          log_level: 'info',
          source: 'runtime'
        });

        response.message = 'Container stopped successfully';
        break;

      case 'restart':
        // Stop first
        await supabase
          .from('projects')
          .update({
            container_status: 'stopped',
            container_id: null
          })
          .eq('id', projectId);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start again
        await supabase
          .from('projects')
          .update({
            container_status: 'running',
            container_id: `container_${projectId}_${Date.now()}`
          })
          .eq('id', projectId);

        await supabase.from('build_logs').insert({
          project_id: projectId,
          message: 'Container restarted successfully',
          log_level: 'info',
          source: 'runtime'
        });

        response.message = 'Container restarted successfully';
        break;

      case 'stats':
        // Simulate resource usage stats
        const stats = {
          cpu_usage: Math.random() * 80, // 0-80%
          memory_usage: Math.floor(Math.random() * project.ram_limit * 0.8), // 0-80% of limit
          disk_usage: Math.floor(Math.random() * project.disk_limit * 0.6), // 0-60% of limit
          network_in: Math.floor(Math.random() * 1000), // MB
          network_out: Math.floor(Math.random() * 500) // MB
        };

        // Store stats in database
        await supabase.from('resource_usage').insert({
          project_id: projectId,
          ...stats
        });

        return new Response(
          JSON.stringify(stats),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Container manager error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
