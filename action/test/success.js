// packages
const { test } = require('tap')

// module
const message = require('../lib/message.js')

const { workflow, run, jobs } = require('./fixtures/success.json')

const expected = [
  { type: 'header', text: { type: 'plain_text', text: 'repo.name: workflow.name #57' } },
  {
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: '`<https://github.com/owner/repo/commit/78d034d2f7580f0535ce44a6d2cff9fdfc86de15|master#c86de15>` commit.message _by *Dev Bot*_' }
    ]
  },
  { type: 'divider' },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: '🟩 *job.name*' },
    accessory: {
      type: 'button',
      text: { type: 'plain_text', emoji: true, text: 'View' },
      url: 'https://github.com/owner/repo/runs/run_id'
    }
  },
  {
    type: 'context',
    elements: [
      { type: 'plain_text', text: '9 steps, completed in 10s' }
    ]
  }
]

test('slack message', assert => {
  assert.plan(1)

  const blocks = message(workflow, run, jobs)

  assert.same(blocks, expected)
})
