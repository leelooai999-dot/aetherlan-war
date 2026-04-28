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

function getIsoTime(value) {
  if (!value || typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function getAgeMinutes(value, now = Date.now()) {
  if (!value || typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.round((now - parsed) / 60000));
}

function compareIsoDesc(a, b) {
  const aTime = Date.parse(a?.createdAt || a?.updatedAt || '') || 0;
  const bTime = Date.parse(b?.createdAt || b?.updatedAt || '') || 0;
  return bTime - aTime;
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

function normalizeWorkerNextStep(nextStep) {
  if (!nextStep || nextStep === 'dispatch-worker-from-queue') {
    return 'mirror-to-worker-and-process-queue';
  }
  return nextStep;
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
          nextStep: normalizeWorkerNextStep(job.workerPayload.nextStep),
        }
      : undefined,
  };
}

export async function buildQueueDashboard() {
  await mkdir(queueDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });
  await mkdir(queueResultsDir, { recursive: true });

  const now = Date.now();
  const STALE_QUEUED_MINUTES = Number.parseInt(process.env.AETHERLAN_STALE_QUEUED_MINUTES || '30', 10);
  const files = (await readdir(queueDir)).filter((file) => file.endsWith('.json') && file !== 'index.json').sort();
  const resultFiles = (await readdir(queueResultsDir)).filter((file) => file.endsWith('.json')).sort();
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

  const sortedJobs = [...jobs].sort(compareIsoDesc);
  const activeJobs = sortedJobs.filter((job) => job.status === 'queued' || job.status === 'processing');
  const staleQueuedJobs = activeJobs
    .filter((job) => job.status === 'queued')
    .map((job) => {
      const queuedMinutes = getAgeMinutes(job.updatedAt || job.createdAt, now);
      return {
        jobId: job.id,
        createdAt: getIsoTime(job.createdAt),
        updatedAt: getIsoTime(job.updatedAt),
        queuedMinutes,
        exceedsThreshold: queuedMinutes != null ? queuedMinutes >= STALE_QUEUED_MINUTES : false,
        storage: job.storage,
        request: job.request
          ? {
              characterId: job.request.characterId,
              action: job.request.action,
              targetSlot: job.request.targetSlot,
              assetKind: job.request.assetKind,
            }
          : undefined,
      };
    })
    .sort((a, b) => (b.queuedMinutes || 0) - (a.queuedMinutes || 0))
    .slice(0, 10);

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
      activeJobCount: activeJobs.length,
      oldestActiveJobAt: getIsoTime(activeJobs[activeJobs.length - 1]?.createdAt),
      newestActiveJobAt: getIsoTime(activeJobs[0]?.createdAt),
      staleQueuedJobCount: staleQueuedJobs.length,
      staleQueuedThresholdMinutes: STALE_QUEUED_MINUTES,
      staleQueuedOverThresholdCount: staleQueuedJobs.filter((job) => job.exceedsThreshold).length,
    },
    statusMismatches,
    orphanResults,
    staleQueuedJobs,
    jobs: jobs.map(sanitizeJob),
    recentResults: [...results].sort(compareIsoDesc).slice(0, 10).map(sanitizeResult),
  };

  await writeFile(join(outputDir, 'queue-dashboard.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('queue: queue-dashboard.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildQueueDashboard();
}
