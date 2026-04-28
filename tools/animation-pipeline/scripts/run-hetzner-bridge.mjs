import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { buildQueueDashboard } from './build-queue-dashboard.mjs';
import { processQueue } from './process-queue.mjs';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

async function runShellScript(name) {
  const fullPath = resolve(rootDir, 'scripts', name);
  const { stdout, stderr } = await execFileAsync('/usr/bin/bash', [fullPath], {
    cwd: rootDir,
    timeout: 10 * 60 * 1000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return { stdout, stderr };
}

async function main() {
  const startedAt = new Date().toISOString();
  const summary = {
    ok: true,
    startedAt,
    steps: [],
  };

  try {
    summary.steps.push({ step: 'pull-hetzner-queue', ...(await runShellScript('pull-hetzner-queue.sh')) });
    await processQueue();
    summary.steps.push({ step: 'process-queue', status: 'done' });
    await buildQueueDashboard();
    summary.steps.push({ step: 'build-queue-dashboard', status: 'done' });
    summary.steps.push({ step: 'push-hetzner-results', ...(await runShellScript('push-hetzner-results.sh')) });
  } catch (error) {
    summary.ok = false;
    summary.error = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
  }

  console.log(JSON.stringify(summary, null, 2));
}

await main();
