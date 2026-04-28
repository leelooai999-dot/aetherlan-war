import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const metadataDir = join(rootDir, 'output', 'metadata');
const atlasDir = join(rootDir, 'output', 'atlas');
const queueResultsDir = join(rootDir, 'output', 'queue-results');
const manifestDir = join(rootDir, 'output');

function sanitizeUpload(upload) {
  return {
    originalName: upload?.originalName ?? upload?.name,
    type: upload?.type,
    size: upload?.size,
  };
}

function sanitizeQueueResult(result) {
  return {
    jobId: result.jobId,
    status: result.status,
    adapter: result.adapter,
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
    failureReason: result.failureReason,
    workspace: result.workspace
      ? {
          root: true,
        }
      : undefined,
    previewUrl: result.previewUrl,
    processedPreviewUrl: result.processedPreviewUrl,
  };
}

export async function buildManifest() {
  await mkdir(manifestDir, { recursive: true });
  const metadataFiles = await readdir(metadataDir).catch(() => []).then((files) => files.filter((file) => file.endsWith('.json')));
  const atlasFiles = await readdir(atlasDir).catch(() => []).then((files) => files.filter((file) => file.endsWith('.json')));
  const queueResultFiles = await readdir(queueResultsDir).catch(() => []).then((files) => files.filter((file) => file.endsWith('.json')));

  const characters = await Promise.all(
    metadataFiles.map(async (file) => JSON.parse(await readFile(join(metadataDir, file), 'utf8')))
  );
  const atlases = await Promise.all(
    atlasFiles.map(async (file) => JSON.parse(await readFile(join(atlasDir, file), 'utf8')))
  );
  const queueResults = await Promise.all(
    queueResultFiles.map(async (file) => JSON.parse(await readFile(join(queueResultsDir, file), 'utf8')))
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    characters: characters.map((character) => ({
      characterId: character.characterId,
      displayName: character.displayName,
      mapSheet: character.inputs.mapSheet,
      performanceSources: character.inputs.performanceSources,
      metadata: `output/metadata/${character.characterId}.metadata.json`,
      atlasPlan: `output/atlas/${character.characterId}.atlas-plan.json`
    })),
    atlases,
    queueResults: queueResults.map(sanitizeQueueResult),
    runtimeContract: {
      characterPublicDir: 'frontend/public/characters',
      effectPublicDir: 'frontend/public/effects',
      mapStates: ['idle', 'run', 'hit', 'death'],
      cinematicStates: ['jump', 'attack', 'skill', 'magic', 'ultimate']
    }
  };

  const outPath = join(manifestDir, 'animation-manifest.json');
  await writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`manifest: ${basename(outPath)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildManifest();
}
