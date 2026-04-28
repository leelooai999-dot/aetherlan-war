import { mkdir, readdir, readFile, writeFile, copyFile, access, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const persistentBaseDir = process.env.AETHERLAN_BASE_DIR?.trim() || null;
const queueDir = persistentBaseDir ? join(persistentBaseDir, 'queue') : join(rootDir, 'queue');
const resultsDir = persistentBaseDir ? join(persistentBaseDir, 'results') : join(rootDir, 'output', 'queue-results');
const jobsRoot = persistentBaseDir ? join(persistentBaseDir, 'worker', 'jobs') : join(rootDir, 'jobs');
const hetznerUploadsRoot = persistentBaseDir ? join(persistentBaseDir, 'uploads') : join(rootDir, 'staging', 'hetzner-uploads');
const frontendGeneratedPreviewsDir = persistentBaseDir ? join(persistentBaseDir, 'frontend', 'public', 'generated-previews') : resolve(rootDir, '..', '..', 'frontend', 'public', 'generated-previews');
const execFileAsync = promisify(execFile);
const preprocessScript = join(rootDir, 'python', 'preprocess_frames.py');
const detectSheetScript = join(rootDir, 'python', 'detect_sheet_layout.py');
const venvPython = join(rootDir, '.venv', 'bin', 'python');

async function readImageSizeWithPython(sourcePath) {
  if (!sourcePath) return null;
  if (!(await exists(venvPython))) return null;

  try {
    const { stdout } = await execFileAsync(venvPython, ['-c', `from PIL import Image; import json, sys; img = Image.open(sys.argv[1]); print(json.dumps({'width': img.width, 'height': img.height}))`, sourcePath], {
      cwd: rootDir,
      timeout: 120000,
    });
    const lastLine = stdout.trim().split('\n').filter(Boolean).at(-1);
    return lastLine ? JSON.parse(lastLine) : null;
  } catch {
    return null;
  }
}

function providerAdapter(provider) {
  if (typeof provider !== 'string') return 'unassigned-adapter';
  const normalized = provider.toLowerCase();
  if (normalized.includes('doubao')) return 'doubao-adapter';
  if (normalized.includes('openai')) return 'openai-images-adapter';
  if (normalized.includes('gemini')) return 'gemini-images-adapter';
  return 'custom-adapter';
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function mapRemoteUploadToLocalPath(uploadPath) {
  if (typeof uploadPath !== 'string') return null;
  const marker = '/opt/aetherlan-war/uploads/';
  if (!uploadPath.includes(marker)) return uploadPath;
  return join(hetznerUploadsRoot, uploadPath.split(marker)[1]);
}

async function deriveUploadsFromMirroredHetzner(jobId) {
  if (!jobId) return [];
  const mirroredDir = join(hetznerUploadsRoot, jobId);
  if (!(await exists(mirroredDir))) return [];

  const entries = await readdir(mirroredDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).sort((a, b) => a.name.localeCompare(b.name));
  const uploads = [];

  for (const entry of files) {
    const sourcePath = join(mirroredDir, entry.name);
    const fileStat = await stat(sourcePath);
    uploads.push({
      name: entry.name,
      size: fileStat.size,
      type: 'application/octet-stream',
      path: `/opt/aetherlan-war/uploads/${jobId}/${entry.name}`,
    });
  }

  return uploads;
}

async function preprocessUploadIfImage(sourcePath, outputsDir) {
  const ext = extname(sourcePath).toLowerCase();
  if (!['.png', '.webp'].includes(ext)) return null;
  if (!(await exists(venvPython)) || !(await exists(preprocessScript))) return null;

  const processedDir = join(outputsDir, 'processed');
  await mkdir(processedDir, { recursive: true });

  try {
    const { stdout } = await execFileAsync(venvPython, [preprocessScript, sourcePath, processedDir], {
      cwd: rootDir,
      timeout: 120000,
    });
    const lastLine = stdout.trim().split('\n').filter(Boolean).at(-1);
    return lastLine ? JSON.parse(lastLine) : null;
  } catch (error) {
    const stdout = typeof error === 'object' && error && 'stdout' in error ? String(error.stdout ?? '') : '';
    const parsed = stdout.trim().split('\n').filter(Boolean).at(-1);
    if (parsed) {
      try {
        return JSON.parse(parsed);
      } catch {
        // fall through to generic error payload
      }
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      input: sourcePath,
    };
  }
}

async function detectSheetLayout(sourcePath, hintedFrameCount) {
  if (!sourcePath) return null;
  if (!(await exists(venvPython)) || !(await exists(detectSheetScript))) return null;

  try {
    const args = [detectSheetScript, sourcePath];
    if (hintedFrameCount) args.push(String(hintedFrameCount));
    const { stdout } = await execFileAsync(venvPython, args, {
      cwd: rootDir,
      timeout: 120000,
    });
    const lastLine = stdout.trim().split('\n').filter(Boolean).at(-1);
    return lastLine ? JSON.parse(lastLine) : null;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      input: sourcePath,
    };
  }
}

async function copyPreviewArtifacts(jobId, copiedUploads, preprocessResults) {
  await mkdir(frontendGeneratedPreviewsDir, { recursive: true });

  const firstUpload = copiedUploads[0]?.jobInputPath;
  const successfulPreprocess = preprocessResults.find((item) => item?.ok && item?.output);
  const previewUrl = firstUpload ? `/generated-previews/${jobId}${extname(firstUpload).toLowerCase() || '.png'}` : null;
  const processedPreviewUrl = successfulPreprocess?.output ? `/generated-previews/${jobId}.processed.png` : null;

  if (firstUpload && previewUrl) {
    await copyFile(firstUpload, join(frontendGeneratedPreviewsDir, `${jobId}${extname(firstUpload).toLowerCase() || '.png'}`));
  }

  if (successfulPreprocess?.output) {
    await copyFile(successfulPreprocess.output, join(frontendGeneratedPreviewsDir, `${jobId}.processed.png`));
    const staleFixed = join(frontendGeneratedPreviewsDir, `${jobId}.processed.fixed.png`);
    if (await exists(staleFixed)) {
      await rm(staleFixed, { force: true });
    }
  }

  return { previewUrl, processedPreviewUrl };
}

export async function processQueue() {
  await mkdir(queueDir, { recursive: true });
  await mkdir(resultsDir, { recursive: true });
  await mkdir(jobsRoot, { recursive: true });

  const files = (await readdir(queueDir)).filter((file) => file.endsWith('.json') && file !== 'index.json').sort();
  let processed = 0;

  for (const file of files) {
    const fullPath = join(queueDir, file);
    const job = JSON.parse(await readFile(fullPath, 'utf8'));
    if (job.status !== 'queued') continue;

    const jobDir = join(jobsRoot, job.id);
    const inputsDir = join(jobDir, 'inputs');
    const outputsDir = join(jobDir, 'outputs');
    const logsDir = join(jobDir, 'logs');

    await mkdir(inputsDir, { recursive: true });
    await mkdir(outputsDir, { recursive: true });
    await mkdir(logsDir, { recursive: true });

    const healedUploads = Array.isArray(job.uploads) && job.uploads.length > 0
      ? job.uploads
      : await deriveUploadsFromMirroredHetzner(job.id);

    const copiedUploads = [];
    const preprocessResults = [];
    let successfulPreprocess = null;
    for (const upload of healedUploads) {
      const resolvedSource = mapRemoteUploadToLocalPath(upload?.path);
      if (!resolvedSource || !(await exists(resolvedSource))) continue;
      const dest = join(inputsDir, basename(resolvedSource));
      await copyFile(resolvedSource, dest);
      copiedUploads.push({
        originalName: upload.name,
        sourcePath: resolvedSource,
        remotePersistentPath: upload.path,
        jobInputPath: dest,
        size: upload.size,
        type: upload.type,
      });
      const preprocessResult = await preprocessUploadIfImage(dest, outputsDir);
      if (preprocessResult) {
        preprocessResults.push(preprocessResult);
        if (!successfulPreprocess && preprocessResult?.ok && preprocessResult?.output) {
          successfulPreprocess = preprocessResult;
        }
      }
    }

    job.status = 'processing';
    job.updatedAt = new Date().toISOString();
    job.jobDir = jobDir;
    job.adapter = providerAdapter(job.request?.provider);
    job.uploads = healedUploads;
    if (job.workerPayload && (!job.workerPayload.uploadCount || job.workerPayload.uploadCount === 0)) {
      job.workerPayload.uploadCount = healedUploads.length;
      job.workerPayload.uploadNames = healedUploads.map((upload) => upload.name);
    }
    job.inputs = copiedUploads;
    await writeFile(fullPath, `${JSON.stringify(job, null, 2)}\n`, 'utf8');

    const stubFrames = Array.from({ length: Number(job.request?.frameCount || 0) || 4 }, (_, index) => ({
      index,
      file: `frame_${String(index).padStart(3, '0')}.png`,
      status: 'planned',
    }));

    const atlasJson = {
      meta: {
        app: 'aetherlan-animation-pipeline',
        version: 'stub-1',
        image: 'atlas.png',
        scale: '1',
      },
      frames: Object.fromEntries(
        stubFrames.map((frame, index) => [frame.file, {
          frame: { x: index * 10, y: 0, w: 256, h: 256 },
          sourceSize: { w: 256, h: 256 },
          spriteSourceSize: { x: 0, y: 0, w: 256, h: 256 },
        }])
      ),
    };

    const downloadBundle = {
      jobId: job.id,
      contents: ['atlas.json', 'atlas.png', 'frames/*.png', 'output-manifest.json'],
      status: 'planned',
    };

    const outputManifest = {
      jobId: job.id,
      generatedAt: new Date().toISOString(),
      adapter: job.adapter,
      request: job.request,
      placeholders: {
        transparentFramesDir: outputsDir,
        atlasJson: join(outputsDir, 'atlas.json'),
        atlasPng: join(outputsDir, 'atlas.png'),
        zipBundle: join(outputsDir, `${job.id}.zip`),
      },
      preprocessResults,
      framePlan: stubFrames,
    };

    await writeFile(join(outputsDir, 'frames.stub.json'), `${JSON.stringify(stubFrames, null, 2)}\n`, 'utf8');
    await writeFile(join(outputsDir, 'atlas.json'), `${JSON.stringify(atlasJson, null, 2)}\n`, 'utf8');
    await writeFile(join(outputsDir, 'bundle.stub.json'), `${JSON.stringify(downloadBundle, null, 2)}\n`, 'utf8');
    await writeFile(join(outputsDir, 'output-manifest.json'), `${JSON.stringify(outputManifest, null, 2)}\n`, 'utf8');
    await writeFile(join(jobDir, 'job.json'), `${JSON.stringify(job, null, 2)}\n`, 'utf8');
    await writeFile(
      join(logsDir, 'consumer.log'),
      `Processed ${job.id} with ${job.adapter}\nCopied uploads: ${copiedUploads.length}\nPreprocess results: ${preprocessResults.length}\nStub frames planned: ${stubFrames.length}\n`,
      'utf8'
    );

    const previewArtifacts = await copyPreviewArtifacts(job.id, copiedUploads, preprocessResults);
    const primarySheetPath = successfulPreprocess?.output ?? copiedUploads[0]?.jobInputPath ?? null;
    const imageLikePath = primarySheetPath && ['.png', '.webp', '.jpg', '.jpeg', '.gif'].includes(extname(primarySheetPath).toLowerCase())
      ? primarySheetPath
      : null;
    const sheetDimensions = imageLikePath ? await readImageSizeWithPython(imageLikePath) : null;
    const detectedSheet = imageLikePath ? await detectSheetLayout(imageLikePath, job.request?.frameCount) : null;

    const result = {
      jobId: job.id,
      createdAt: new Date().toISOString(),
      status: 'done',
      adapter: job.adapter,
      note: 'Queue consumer created job workspace, copied uploaded inputs, emitted stub frame/atlas/bundle manifests, and now attempts image trim preprocessing for uploaded PNG/WebP sources.',
      request: job.request,
      uploads: copiedUploads,
      source: {
        intakeStorage: job.storage ?? 'unknown',
        queueJobPath: fullPath,
      },
      workspace: {
        root: jobDir,
        inputs: inputsDir,
        outputs: outputsDir,
        logs: logsDir,
      },
      sheetWidth: detectedSheet?.width ?? sheetDimensions?.width ?? null,
      sheetHeight: detectedSheet?.height ?? sheetDimensions?.height ?? null,
      detectedFrameCount: detectedSheet?.frameCount ?? null,
      detectedColumns: detectedSheet?.columns ?? null,
      detectedRows: detectedSheet?.rows ?? null,
      detectedFrameWidth: detectedSheet?.frameWidth ?? null,
      detectedFrameHeight: detectedSheet?.frameHeight ?? null,
      outputs: {
        transparentFrames: preprocessResults.some((item) => item?.ok),
        atlasPacked: false,
        zipReady: false,
        manifest: join(outputsDir, 'output-manifest.json'),
        atlasJson: join(outputsDir, 'atlas.json'),
        framePlan: join(outputsDir, 'frames.stub.json'),
        bundlePlan: join(outputsDir, 'bundle.stub.json'),
        preprocessReport: join(outputsDir, 'output-manifest.json'),
      },
      previewUrl: previewArtifacts.previewUrl,
      processedPreviewUrl: previewArtifacts.processedPreviewUrl,
    };

    job.status = 'done';
    job.updatedAt = new Date().toISOString();
    job.resultPath = `output/queue-results/${job.id}.result.json`;

    await writeFile(fullPath, `${JSON.stringify(job, null, 2)}\n`, 'utf8');
    await writeFile(join(resultsDir, `${job.id}.result.json`), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    processed += 1;
  }

  console.log(`queue-processed: ${processed}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await processQueue();
}
