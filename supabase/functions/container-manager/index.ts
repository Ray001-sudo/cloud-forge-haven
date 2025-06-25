
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContainerAction {
  action: 'start' | 'stop' | 'restart' | 'build' | 'logs' | 'stats'
  projectId: string
  userId?: string
  buildConfig?: {
    runtime: string
    buildCommand?: string
    startCommand?: string
    environmentVariables?: Record<string, string>
  }
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

    const { action, projectId, userId, buildConfig }: ContainerAction = await req.json()

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectError?.message}`)
    }

    let result: any = {}

    switch (action) {
      case 'build':
        result = await buildContainer(project, buildConfig, supabase)
        break
      case 'start':
        result = await startContainer(project, supabase)
        break
      case 'stop':
        result = await stopContainer(project, supabase)
        break
      case 'restart':
        result = await restartContainer(project, supabase)
        break
      case 'logs':
        result = await getContainerLogs(project, supabase)
        break
      case 'stats':
        result = await getContainerStats(project, supabase)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Container manager error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function buildContainer(project: any, buildConfig: any, supabase: any) {
  const startTime = Date.now()
  
  // Create deployment record
  const { data: deployment, error: deployError } = await supabase
    .from('deployments')
    .insert({
      project_id: project.id,
      status: 'building',
      build_status: 'building',
    })
    .select()
    .single()

  if (deployError) throw deployError

  try {
    // Log build start
    await supabase
      .from('build_logs')
      .insert({
        project_id: project.id,
        deployment_id: deployment.id,
        message: `Starting build for ${project.name}`,
        source: 'build',
        log_level: 'info'
      })

    // Simulate Docker build process (in real implementation, this would use Docker API)
    const buildSteps = [
      'Pulling base image...',
      'Installing dependencies...',
      'Building application...',
      'Creating container image...',
      'Build completed successfully'
    ]

    for (const step of buildSteps) {
      await supabase
        .from('build_logs')
        .insert({
          project_id: project.id,
          deployment_id: deployment.id,
          message: step,
          source: 'build',
          log_level: 'info'
        })
      
      // Simulate build time
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const buildDuration = Math.floor((Date.now() - startTime) / 1000)
    const containerImageName = `cloudforge/${project.subdomain}:latest`

    // Update project with container info
    await supabase
      .from('projects')
      .update({
        docker_image: containerImageName,
        container_status: 'stopped',
        last_deployed_at: new Date().toISOString()
      })
      .eq('id', project.id)

    // Update deployment record
    await supabase
      .from('deployments')
      .update({
        status: 'success',
        build_status: 'success',
        build_duration: buildDuration,
        deployed_at: new Date().toISOString(),
        deployment_url: `https://${project.subdomain}.cloudforge.dev`
      })
      .eq('id', deployment.id)

    return {
      success: true,
      message: 'Build completed successfully',
      buildDuration,
      deploymentId: deployment.id
    }

  } catch (error) {
    // Log build failure
    await supabase
      .from('build_logs')
      .insert({
        project_id: project.id,
        deployment_id: deployment.id,
        message: `Build failed: ${error.message}`,
        source: 'build',
        log_level: 'error'
      })

    // Update deployment with failure
    await supabase
      .from('deployments')
      .update({
        status: 'failed',
        build_status: 'failed',
        build_duration: Math.floor((Date.now() - startTime) / 1000)
      })
      .eq('id', deployment.id)

    throw error
  }
}

async function startContainer(project: any, supabase: any) {
  if (!project.docker_image) {
    throw new Error('No container image found. Please build the project first.')
  }

  // Simulate container start (in real implementation, use Docker API)
  const containerId = `container_${project.id}_${Date.now()}`
  
  await supabase
    .from('projects')
    .update({
      container_status: 'running',
      container_id: containerId,
      last_deployed_at: new Date().toISOString()
    })
    .eq('id', project.id)

  await supabase
    .from('build_logs')
    .insert({
      project_id: project.id,
      message: `Container started with ID: ${containerId}`,
      source: 'system',
      log_level: 'info'
    })

  // Start resource monitoring
  startResourceMonitoring(project.id, supabase)

  return {
    success: true,
    message: 'Container started successfully',
    containerId,
    url: `https://${project.subdomain}.cloudforge.dev`
  }
}

async function stopContainer(project: any, supabase: any) {
  await supabase
    .from('projects')
    .update({
      container_status: 'stopped',
      container_id: null
    })
    .eq('id', project.id)

  await supabase
    .from('build_logs')
    .insert({
      project_id: project.id,
      message: 'Container stopped',
      source: 'system',
      log_level: 'info'
    })

  return {
    success: true,
    message: 'Container stopped successfully'
  }
}

async function restartContainer(project: any, supabase: any) {
  await stopContainer(project, supabase)
  await new Promise(resolve => setTimeout(resolve, 2000))
  return await startContainer(project, supabase)
}

async function getContainerLogs(project: any, supabase: any) {
  const { data: logs, error } = await supabase
    .from('build_logs')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  return { logs }
}

async function getContainerStats(project: any, supabase: any) {
  // Simulate resource usage (in real implementation, get from Docker API)
  const stats = {
    cpu_usage: Math.random() * 50,
    memory_usage: Math.floor(Math.random() * project.ram_limit),
    disk_usage: Math.floor(Math.random() * 500),
    network_in: Math.floor(Math.random() * 100),
    network_out: Math.floor(Math.random() * 100)
  }

  // Store resource usage
  await supabase
    .from('resource_usage')
    .insert({
      project_id: project.id,
      ...stats
    })

  return stats
}

async function startResourceMonitoring(projectId: string, supabase: any) {
  // In a real implementation, this would be a separate service
  // For now, we'll simulate periodic resource monitoring
  console.log(`Started resource monitoring for project ${projectId}`)
}
