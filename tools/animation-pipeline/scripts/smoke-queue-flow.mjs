import { mkdtemp, writeFile, rm, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let processQueue;
let buildQueueDashboard;

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const queueDir = join(rootDir, 'queue');
const stagingUploadsDir = join(rootDir, 'staging', 'hetzner-uploads');
const resultsDir = join(rootDir, 'output', 'queue-results');
const dashboardPath = join(rootDir, 'output', 'queue-dashboard.json');

function checkDependencies() {
  const missing = [];
  const candidates = [
    'image-size',
    'next/dist/compiled/image-size',
  ];
  const searchPaths = [rootDir, resolve(rootDir, '..', '..', 'frontend')];
  const found = candidates.some((candidate) => {
    try {
      require.resolve(candidate, { paths: searchPaths });
      return true;
    } catch {
      return false;
    }
  });
  if (!found) missing.push('image-size');
  return missing;
}

const tmpRoot = await mkdtemp(join(tmpdir(), 'aetherlan-queue-smoke-'));
const localPng = join(tmpRoot, 'sample.png');
const jobId = `smoke-${Date.now()}`;
const queuePath = join(queueDir, `${jobId}.json`);
const stagedRemotePath = join(stagingUploadsDir, jobId, 'sample.png');
const resultPath = join(resultsDir, `${jobId}.result.json`);

const png1x1Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+y4i8AAAAASUVORK5CYII=';

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
    provider: 'smoke-provider',
    intent: 'queue-smoke-test',
  },
  uploads: [
    {
      name: 'sample.png',
      size: Buffer.from(png1x1Base64, 'base64').length,
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
    uploadNames: ['sample.png'],
    status: 'persistent-intake-received',
    nextStep: 'mirror-to-worker-and-process-queue',
  },
  nextStep: 'Smoke test queue entry',
};

try {
  const missing = checkDependencies();
  if (missing.length) {
    console.log(JSON.stringify({
      ok: false,
      blocked: true,
      reason: 'missing-dependencies',
      missing,
      hint: 'Install missing packages for tools/animation-pipeline before trusting queue processing smoke tests.',
    }, null, 2));
    process.exit(1);
  }

  ({ processQueue } = await import('./process-queue.mjs'));
  ({ buildQueueDashboard } = await import('./build-queue-dashboard.mjs'));

  await mkdir(join(stagingUploadsDir, jobId), { recursive: true });
  await writeFile(localPng, Buffer.from(png1x1Base64, 'base64'));
  await writeFile(stagedRemotePath, Buffer.from(png1x1Base64, 'base64'));
  await writeFile(queuePath, `${JSON.stringify(job, null, 2)}\n`, 'utf8');

  await processQueue();
  await buildQueueDashboard();

  const result = JSON.parse(await readFile(resultPath, 'utf8'));
  const dashboard = JSON.parse(await readFile(dashboardPath, 'utf8'));
  const dashboardJob = dashboard.jobs?.find((item) => item.id === jobId);

  const healthOk = dashboard?.health?.ok === true;
  const statusMismatchCount = dashboard?.health?.statusMismatchCount ?? null;
  const orphanResultCount = dashboard?.health?.orphanResultCount ?? null;

  console.log(JSON.stringify({
    ok: result.status === 'done'
      && dashboardJob?.status === 'done'
      && healthOk,
    jobId,
    resultStatus: result.status,
    dashboardStatus: dashboardJob?.status ?? null,
    dashboardHealthOk: healthOk,
    statusMismatchCount,
    orphanResultCount,
    previewUrl: result.previewUrl ?? null,
    processedPreviewUrl: result.processedPreviewUrl ?? null,
    detectedFrameCount: result.detectedFrameCount ?? null,
  }, null, 2));
} finally {
  await rm(queuePath, { force: true }).catch(() => {});
  await rm(resultPath, { force: true }).catch(() => {});
  await rm(join(stagingUploadsDir, jobId), { recursive: true, force: true }).catch(() => {});
  await rm(join(rootDir, 'jobs', jobId), { recursive: true, force: true }).catch(() => {});
  await rm(join(resolve(rootDir, '..', '..', 'frontend', 'public', 'generated-previews'), `${jobId}.png`), { force: true }).catch(() => {});
  await rm(join(resolve(rootDir, '..', '..', 'frontend', 'public', 'generated-previews'), `${jobId}.processed.png`), { force: true }).catch(() => {});
  await rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
  if (buildQueueDashboard) {
    await buildQueueDashboard().catch(() => {});
  }
}
