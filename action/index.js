// packages
const { IncomingWebhook } = require('@slack/webhook')
const core = require('@actions/core')
const github = require('@actions/github')
// libraries
const message = require('./lib/message')

// parse inputs
const inputs = {
  token: core.getInput('github-token', { required: true }),
  webhook: core.getInput('slack-webhook', { required: true }),
  ignore: {
    jobs: (core.getInput('ignore-jobs') || '').split(',').map(Function.prototype.call, String.prototype.trim),
    steps: (core.getInput('ignore-steps') || '').split(',').map(Function.prototype.call, String.prototype.trim)
  }
}

// error handler
function errorHandler ({ message, stack }) {
  console.error(err)
  core.setFailed(`Unhandled error: ${err}`)
}

// catch errors and exit
process.on('unhandledRejection', errorHandler)
process.on('uncaughtException', errorHandler)

// exit early
if (!github.context.workflow || !github.context.runId) {
  core.error('action triggered outside of a workflow run')
  process.exit(1)
}

// initiate the client
const octokit = github.getOctokit(inputs.token)

async function main () {
  // fetch workflow
  const { data: { workflows } } = await octokit.actions.listRepoWorkflows({
    ...github.context.repo
  })

  // find the current workflow
  const workflow = workflows.find(workflow => workflow.name === github.context.workflow)

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

  const blocks = message(workflow, run.data, jobs, inputs.ignore)

  // send to Slack
  const webhook = new IncomingWebhook(inputs.webhook)
  await webhook.send({ blocks })
}

// awaiting top-level await
main()
