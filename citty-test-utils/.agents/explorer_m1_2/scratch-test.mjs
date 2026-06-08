import { runLocalCitty } from '../../src/core/runners/local-runner.js'

async function run() {
  try {
    const result = await runLocalCitty({
      args: ['--show-help'],
      env: { TEST_CLI: 'true' }
    })
    console.log('--- Result ---')
    console.log('success:', result.success)
    console.log('exitCode:', result.exitCode)
    console.log('stdout:', JSON.stringify(result.stdout))
    console.log('stderr:', JSON.stringify(result.stderr))
  } catch (error) {
    console.error('Error:', error)
  }
}

run()
