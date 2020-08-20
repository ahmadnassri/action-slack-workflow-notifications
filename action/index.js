const { IncomingWebhook } = require('@slack/webhook')
const core = require('@actions/core')
const github = require('@actions/github')
const message = require('./lib/message')

// parse inputs
const inputs = {
  token: core.getInput('github-token', { required: true }),
  webhook: core.getInput('slack-webhook', { required: true })
}

// error handler
function errorHandler (err) {
  console.error(err)
  core.setFailed(`Unhandled error: ${err}`)
}

// catch errors and exit
process.on('unhandledRejection', errorHandler)
process.on('uncaughtException', errorHandler)

// exit early
if (!github.context.workflow || !github.context.runId) {
  core.setFailed('action triggered outside of a workflow run')
  process.exit(1)
}

const octokit = github.getOctokit(inputs.token)

async function main () {
  // fetch workflow
  const workflow = await octokit.actions.getWorkflow({
    ...github.context.repo,
    workflow_id: github.context.workflow
  })

  // fetch run
  const run = await octokit.actions.getWorkflowRun({
    ...github.context.repo,
    run_id: github.context.runId
  })

  // fetch jobs
  const { data: { jobs } } = await octokit.actions.listJobsForWorkflowRun({
    ...github.context.repo,
    run_id: github.context.runId
  })

  const blocks = message(workflow.data, run.data, jobs)

  // send to Slack
  const webhook = new IncomingWebhook(inputs.webhook)
  await webhook.send({ blocks })
}

main()
