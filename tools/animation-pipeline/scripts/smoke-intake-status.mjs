import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const pipelineDir = resolve(new URL('..', import.meta.url).pathname);
const projectRoot = resolve(pipelineDir, '..', '..');
const backendPath = resolve(projectRoot, 'backend', 'intake_server.py');

const tmpBase = await mkdtemp(join(tmpdir(), 'aetherlan-intake-status-'));
const baseDir = join(tmpBase, 'base');
const queueDir = join(baseDir, 'queue');
const resultsDir = join(baseDir, 'results');
const uploadsDir = join(baseDir, 'uploads');
const localResultsDir = join(pipelineDir, 'output', 'queue-results');
const localQueueDir = join(pipelineDir, 'queue');
const port = 18110;
const jobId = `smoke-status-${Date.now()}`;

const job = {
  id: jobId,
  createdAt: new Date().toISOString(),
  status: 'queued',
  source: 'smoke-test',
  storage: 'hetzner-disk-persistent',
  request: {
    role: '立绘',
    characterId: 'isolde',
    characterLabel: '伊索德',
    action: 'attack',
    targetSlot: 'attack',
    assetKind: 'battle-animation',
    frameCount: '4',
    intent: 'intake-status-smoke',
  },
  uploads: [
    {
      name: 'sample.png',
      size: 68,
      type: 'image/png',
      path: `/opt/aetherlan-war/uploads/${jobId}/sample.png`,
    },
  ],
  workerPayload: {
    jobId,
    role: '立绘',
    characterId: 'isolde',
    characterLabel: '伊索德',
    action: 'attack',
    targetSlot: 'attack',
    assetKind: 'battle-animation',
    uploadCount: 1,
    status: 'persistent-intake-received',
    nextStep: 'mirror-to-worker-and-process-queue',
  },
  nextStep: 'Smoke test persistent status visibility',
};

const result = {
  jobId,
  status: 'done',
  request: job.request,
  previewUrl: `/generated-previews/${jobId}.png`,
  processedPreviewUrl: `/generated-previews/${jobId}.processed.png`,
  detectedFrameCount: 4,
  outputs: {
    transparentFrames: true,
    atlasPacked: true,
    zipReady: false,
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) return true;
    } catch {}
    await sleep(250);
  }
  return false;
}

const child = spawn('python3', [backendPath], {
  cwd: projectRoot,
  env: {
    ...process.env,
    AETHERLAN_BASE_DIR: baseDir,
    AETHERLAN_PIPELINE_DIR: pipelineDir,
    AETHERLAN_HOST: '127.0.0.1',
    AETHERLAN_PORT: String(port),
    AETHERLAN_PUBLIC_APP_ORIGIN: 'https://aetherlan-war.vercel.app',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stderr = '';
child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

try {
  await mkdir(queueDir, { recursive: true });
  await mkdir(resultsDir, { recursive: true });
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(join(queueDir, `${jobId}.json`), `${JSON.stringify(job, null, 2)}\n`, 'utf8');
  await writeFile(join(resultsDir, `${jobId}.result.json`), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  const healthy = await waitForHealth(`http://127.0.0.1:${port}/health`);
  if (!healthy) {
    throw new Error(`intake server did not become healthy${stderr ? `: ${stderr.trim()}` : ''}`);
  }

  const response = await fetch(`http://127.0.0.1:${port}/api/generator/status?jobId=${encodeURIComponent(jobId)}`, {
    headers: {
      Accept: 'application/json',
      Origin: 'https://aetherlan-war.vercel.app',
    },
    cache: 'no-store',
  });

  const payload = await response.json();
  const corsOrigin = response.headers.get('access-control-allow-origin');

  console.log(JSON.stringify({
    ok: response.ok
      && payload?.ok === true
      && payload?.found === true
      && payload?.status === 'done'
      && payload?.progress?.stage === 'done-with-preview'
      && payload?.queueDepth === 'persistent'
      && payload?.workerPayload?.uploadCount === 1
      && corsOrigin === 'https://aetherlan-war.vercel.app',
    statusCode: response.status,
    corsOrigin,
    jobId,
    status: payload?.status ?? null,
    progressStage: payload?.progress?.stage ?? null,
    queueDepth: payload?.queueDepth ?? null,
    workerUploadCount: payload?.workerPayload?.uploadCount ?? null,
    previewUrl: payload?.previewUrl ?? null,
    processedPreviewUrl: payload?.processedPreviewUrl ?? null,
  }, null, 2));
} finally {
  child.kill('SIGTERM');
  await sleep(250);
  if (!child.killed) {
    child.kill('SIGKILL');
  }
  await rm(join(queueDir, `${jobId}.json`), { force: true }).catch(() => {});
  await rm(join(resultsDir, `${jobId}.result.json`), { force: true }).catch(() => {});
  await rm(join(localQueueDir, `${jobId}.json`), { force: true }).catch(() => {});
  await rm(join(localResultsDir, `${jobId}.result.json`), { force: true }).catch(() => {});
  await rm(tmpBase, { recursive: true, force: true }).catch(() => {});
}
