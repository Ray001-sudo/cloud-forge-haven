
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active cron jobs that should run now
    const now = new Date().toISOString()
    const { data: jobs, error } = await supabase
      .from('cron_jobs')
      .select('*, projects(*)')
      .eq('status', 'active')
      .lte('next_run', now)

    if (error) {
      console.error('Error fetching cron jobs:', error)
      return new Response('Error fetching jobs', { status: 500 })
    }

    const results = []

    for (const job of jobs || []) {
      try {
        const result = await executeCronJob(job, supabase)
        results.push(result)
      } catch (error) {
        console.error(`Error executing job ${job.id}:`, error)
        results.push({ jobId: job.id, error: error.message })
      }
    }

    return new Response(JSON.stringify({
      message: `Processed ${results.length} cron jobs`,
      results
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Cron executor error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function executeCronJob(job: any, supabase: any) {
  const startTime = Date.now()
  
  try {
    // Simulate command execution (in real implementation, execute in container)
    let output = ''
    let success = true

    // Basic command simulation
    if (job.command.includes('python')) {
      output = `Python script executed successfully at ${new Date().toISOString()}`
    } else if (job.command.includes('node')) {
      output = `Node.js script executed successfully at ${new Date().toISOString()}`
    } else if (job.command.includes('curl')) {
      output = `HTTP request sent successfully at ${new Date().toISOString()}`
    } else {
      output = `Command '${job.command}' executed successfully at ${new Date().toISOString()}`
    }

    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))

    const executionTime = Date.now() - startTime

    // Update job with execution results
    const nextRun = await calculateNextRun(job.schedule)
    
    await supabase
      .from('cron_jobs')
      .update({
        last_run: new Date().toISOString(),
        next_run: nextRun,
        last_output: output,
        success_count: job.success_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)

    // Log execution
    await supabase
      .from('build_logs')
      .insert({
        project_id: job.project_id,
        message: `Cron job '${job.name}' executed: ${output}`,
        source: 'system',
        log_level: 'info'
      })

    return {
      jobId: job.id,
      jobName: job.name,
      success: true,
      executionTime,
      output
    }

  } catch (error) {
    // Update job with error
    await supabase
      .from('cron_jobs')
      .update({
        last_run: new Date().toISOString(),
        last_output: `Error: ${error.message}`,
        error_count: job.error_count + 1,
        status: job.error_count + 1 >= 5 ? 'error' : 'active', // Disable after 5 consecutive errors
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)

    // Log error
    await supabase
      .from('build_logs')
      .insert({
        project_id: job.project_id,
        message: `Cron job '${job.name}' failed: ${error.message}`,
        source: 'system',
        log_level: 'error'
      })

    throw error
  }
}

async function calculateNextRun(schedule: string): Promise<string> {
  const now = new Date()
  let nextRun = new Date()

  // Simple cron parser
  switch (schedule) {
    case '* * * * *': // every minute
      nextRun = new Date(now.getTime() + 60000)
      break
    case '*/5 * * * *': // every 5 minutes  
      nextRun = new Date(Math.ceil(now.getTime() / 300000) * 300000)
      break
    case '0 * * * *': // every hour
      nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0)
      break
    case '0 0 * * *': // daily at midnight
      nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
      break
    case '0 9 * * *': // daily at 9 AM
      nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
      if (nextRun <= now) {
        nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0)
      }
      break
    default: // default to hourly
      nextRun = new Date(now.getTime() + 3600000)
  }

  return nextRun.toISOString()
}
