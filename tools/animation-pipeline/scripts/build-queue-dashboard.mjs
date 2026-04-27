import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const queueDir = join(rootDir, 'queue');
const queueResultsDir = join(rootDir, 'output', 'queue-results');
const outputDir = join(rootDir, 'output');

function sanitizeUpload(upload) {
  return {
    originalName: upload?.originalName ?? upload?.name,
    type: upload?.type,
    size: upload?.size,
  };
}

function sanitizeResult(result) {
  return {
    jobId: result.jobId,
    createdAt: result.createdAt,
    status: result.status,
    adapter: result.adapter,
    note: result.note,
    request: result.request
      ? {
          role: result.request.role,
          action: result.request.action,
          frameCount: result.request.frameCount,
          intent: result.request.intent,
        }
      : undefined,
    uploads: Array.isArray(result.uploads) ? result.uploads.map(sanitizeUpload) : [],
    source: result.source
      ? {
          intakeStorage: result.source.intakeStorage,
        }
      : undefined,
    outputs: result.outputs
      ? {
          transparentFrames: result.outputs.transparentFrames,
          atlasPacked: result.outputs.atlasPacked,
          zipReady: result.outputs.zipReady,
          manifest: Boolean(result.outputs.manifest),
          atlasJson: Boolean(result.outputs.atlasJson),
          framePlan: Boolean(result.outputs.framePlan),
          bundlePlan: Boolean(result.outputs.bundlePlan),
        }
      : undefined,
    workspace: result.workspace
      ? {
          root: true,
        }
      : undefined,
    previewUrl: result.previewUrl,
    processedPreviewUrl: result.processedPreviewUrl,
  };
}

function sanitizeJob(job) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    storage: job.storage,
    request: job.request
      ? {
          role: job.request.role,
          action: job.request.action,
          frameCount: job.request.frameCount,
          intent: job.request.intent,
        }
      : undefined,
  };
}

export async function buildQueueDashboard() {
  await mkdir(queueDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const files = (await readdir(queueDir)).filter((file) => file.endsWith('.json') && file !== 'index.json').sort();
  const resultFiles = await readdir(queueResultsDir).catch(() => []).then((items) => items.filter((file) => file.endsWith('.json')).sort());
  const jobs = await Promise.all(files.map(async (file) => JSON.parse(await readFile(join(queueDir, file), 'utf8'))));
  const results = await Promise.all(resultFiles.map(async (file) => JSON.parse(await readFile(join(queueResultsDir, file), 'utf8'))));

  const payload = {
    generatedAt: new Date().toISOString(),
    total: jobs.length,
    queued: jobs.filter((job) => job.status === 'queued').length,
    processing: jobs.filter((job) => job.status === 'processing').length,
    done: jobs.filter((job) => job.status === 'done').length,
    failed: jobs.filter((job) => job.status === 'failed').length,
    jobs: jobs.map(sanitizeJob),
    recentResults: results.slice(-10).reverse().map(sanitizeResult),
  };

  await writeFile(join(outputDir, 'queue-dashboard.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('queue: queue-dashboard.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildQueueDashboard();
}
