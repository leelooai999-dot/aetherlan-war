import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const persistentBaseDir = process.env.AETHERLAN_BASE_DIR?.trim() || null;
const queueDir = persistentBaseDir ? join(persistentBaseDir, 'queue') : join(rootDir, 'queue');
const queueResultsDir = persistentBaseDir ? join(persistentBaseDir, 'results') : join(rootDir, 'output', 'queue-results');
const outputDir = persistentBaseDir ? join(rootDir, 'output') : join(rootDir, 'output');

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
          characterId: result.request.characterId,
          characterLabel: result.request.characterLabel,
          action: result.request.action,
          targetSlot: result.request.targetSlot,
          assetKind: result.request.assetKind,
          frameCount: result.request.frameCount,
          provider: result.request.provider,
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
    updatedAt: job.updatedAt,
    resultPath: job.resultPath,
    storage: job.storage,
    request: job.request
      ? {
          role: job.request.role,
          characterId: job.request.characterId,
          characterLabel: job.request.characterLabel,
          action: job.request.action,
          targetSlot: job.request.targetSlot,
          assetKind: job.request.assetKind,
          frameCount: job.request.frameCount,
          provider: job.request.provider,
          intent: job.request.intent,
        }
      : undefined,
    uploads: Array.isArray(job.uploads)
      ? job.uploads.map((upload, index) => ({
          label: `asset-${index + 1}`,
          name: upload?.name,
          size: upload?.size,
          type: upload?.type,
        }))
      : [],
    workerPayload: job.workerPayload
      ? {
          jobId: job.workerPayload.jobId,
          role: job.workerPayload.role,
          characterId: job.workerPayload.characterId,
          characterLabel: job.workerPayload.characterLabel,
          action: job.workerPayload.action,
          targetSlot: job.workerPayload.targetSlot,
          assetKind: job.workerPayload.assetKind,
          provider: job.workerPayload.provider,
          uploadCount: job.workerPayload.uploadCount,
          uploadNames: job.workerPayload.uploadNames,
          status: job.workerPayload.status,
          nextStep: job.workerPayload.nextStep,
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

  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const resultsById = new Map(results.map((result) => [result.jobId, result]));
  const statusMismatches = [];

  for (const job of jobs) {
    const result = resultsById.get(job.id);
    if (!result) continue;
    if (job.status !== result.status) {
      statusMismatches.push({
        jobId: job.id,
        jobStatus: job.status,
        resultStatus: result.status,
      });
    }
  }

  const orphanResults = results
    .filter((result) => !jobsById.has(result.jobId))
    .map((result) => ({
      jobId: result.jobId,
      status: result.status,
      createdAt: result.createdAt,
    }));

  const payload = {
    generatedAt: new Date().toISOString(),
    total: jobs.length,
    queued: jobs.filter((job) => job.status === 'queued').length,
    processing: jobs.filter((job) => job.status === 'processing').length,
    done: jobs.filter((job) => job.status === 'done').length,
    failed: jobs.filter((job) => job.status === 'failed').length,
    health: {
      ok: statusMismatches.length === 0 && orphanResults.length === 0,
      statusMismatchCount: statusMismatches.length,
      orphanResultCount: orphanResults.length,
    },
    statusMismatches,
    orphanResults,
    jobs: jobs.map(sanitizeJob),
    recentResults: results.slice(-10).reverse().map(sanitizeResult),
  };

  await writeFile(join(outputDir, 'queue-dashboard.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('queue: queue-dashboard.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildQueueDashboard();
}
