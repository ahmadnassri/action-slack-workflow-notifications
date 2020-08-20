const conclusions = {
  success: '🟩',
  failure: '🟥',
  neutral: '🟨',
  cancelled: '🟧',
  skipped: '🟦',
  timed_out: '🟥',
  action_required: '🟪'
}

function duration (element) {
  const duration = new Date(element.completed_at).getTime() - new Date(element.started_at).getTime()
  return Math.abs(duration / 1000)
}

module.exports = function (workflow, run, jobs) {
  // construct slack blocks
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${run.repository.name}: ${workflow.name} #${run.run_number}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `\`<${run.repository.html_url}/commit/${run.head_commit.id}|${run.head_branch}#${run.head_commit.id.slice(-7)}>\` ${run.head_commit.message} _by *${run.head_commit.committer.name}*_`
        }
      ]
    },
    {
      type: 'divider'
    }
  ]

  // new block for each job
  for (const index in jobs) {
    const job = jobs[index]

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${conclusions[job.conclusion] || '🟫'} *${job.name}*`
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          emoji: true,
          text: 'View'
        },
        url: job.html_url
      }
    })

    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: job.steps.map(step => `${conclusions[step.conclusion] || '🟫'} ${step.name}`).join('\n')
      }]
    })

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: `${job.steps.length} steps, completed in ${duration(job)}s`
        }
      ]
    })

    if (index < jobs.length - 1) {
      blocks.push({ type: 'divider' })
    }
  }

  return blocks
}
