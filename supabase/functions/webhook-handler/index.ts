
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const projectId = pathParts[pathParts.length - 1]

    if (!projectId) {
      return new Response('Project ID required', { status: 400 })
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return new Response('Project not found', { status: 404 })
    }

    // Extract request details
    const body = await req.text()
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })

    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Store webhook request
    await supabase
      .from('webhook_requests')
      .insert({
        project_id: projectId,
        method: req.method,
        url: url.pathname,
        headers,
        body,
        ip_address: clientIP,
        user_agent: userAgent,
        response_status: 200
      })

    // Process webhook based on project type
    let response = { message: 'Webhook received successfully', timestamp: new Date().toISOString() }

    if (project.app_type === 'bot') {
      // Handle bot webhooks (Discord, Telegram, etc.)
      response = await processBotWebhook(body, headers, project, supabase)
    } else if (headers['x-github-event']) {
      // Handle GitHub webhooks for CI/CD
      response = await processGitHubWebhook(body, headers, project, supabase)
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processBotWebhook(body: string, headers: Record<string, string>, project: any, supabase: any) {
  // Log bot activity
  await supabase
    .from('build_logs')
    .insert({
      project_id: project.id,
      message: 'Bot webhook received',
      source: 'runtime',
      log_level: 'info'
    })

  return { message: 'Bot webhook processed', project: project.name }
}

async function processGitHubWebhook(body: string, headers: Record<string, string>, project: any, supabase: any) {
  const event = headers['x-github-event']
  const payload = JSON.parse(body)

  if (event === 'push') {
    // Trigger rebuild on push
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/container-manager`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'build',
        projectId: project.id,
        buildConfig: {
          runtime: project.runtime,
          buildCommand: project.build_command,
          startCommand: project.start_command,
          environmentVariables: project.environment_variables
        }
      })
    })

    await supabase
      .from('build_logs')
      .insert({
        project_id: project.id,
        message: `GitHub push received: ${payload.head_commit?.message || 'No commit message'}`,
        source: 'system',
        log_level: 'info'
      })

    return { message: 'Build triggered by GitHub push', commit: payload.head_commit?.id }
  }

  return { message: 'GitHub webhook processed', event }
}
