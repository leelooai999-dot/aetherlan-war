import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const projectRoot = resolve(rootDir, '..', '..');
const configDir = join(rootDir, 'config');
const outputDir = join(rootDir, 'output', 'metadata');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadConfigs() {
  const files = (await readdir(configDir)).filter((file) => file.startsWith('characters.') && file.endsWith('.json'));
  return Promise.all(files.map(async (file) => ({
    file,
    config: JSON.parse(await readFile(join(configDir, file), 'utf8'))
  })));
}

function inferCinematicStates(actions) {
  const all = ['jump', 'attack', 'skill', 'magic', 'ultimate'];
  return all.filter((state) => actions.some((action) => action.id?.includes(state) || action.id === state));
}

function resolveAsset(relativePath) {
  return resolve(projectRoot, 'tools', 'animation-pipeline', 'config', relativePath);
}

export async function buildMetadata() {
  await mkdir(outputDir, { recursive: true });
  const configs = await loadConfigs();

  for (const { config } of configs) {
    const metadata = {
      characterId: config.characterId,
      displayName: config.displayName,
      generatedAt: new Date().toISOString(),
      inputs: {
        referenceImage: config.referenceImage,
        profileImage: config.profileImage,
        mapSheet: config.mapModule.sheet,
        performanceSources: config.performanceModule.actions.map((action) => action.source)
      },
      filesVerified: {
        referenceImage: await exists(resolveAsset(config.referenceImage)),
        profileImage: await exists(resolveAsset(config.profileImage)),
        mapSheet: await exists(resolveAsset(config.mapModule.sheet)),
        performanceSources: await Promise.all(
          config.performanceModule.actions.map(async (action) => ({
            id: action.id,
            exists: await exists(resolveAsset(action.source))
          }))
        )
      },
      mapModule: {
        frameWidth: config.mapModule.frameWidth,
        frameHeight: config.mapModule.frameHeight,
        rows: config.mapModule.rows,
        columns: config.mapModule.columns,
        anchor: config.mapModule.anchor,
        scale: config.mapModule.scale,
        actions: Object.entries(config.mapModule.actions).map(([id, action]) => ({ id, ...action }))
      },
      performanceModule: config.performanceModule.actions,
      generation: config.generation,
      runtime: {
        mapStates: ['idle', 'run', 'hit', 'death'],
        cinematicStates: inferCinematicStates(config.performanceModule.actions)
      }
    };

    const outPath = join(outputDir, `${config.characterId}.metadata.json`);
    await writeFile(outPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
    console.log(`metadata: ${basename(outPath)}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildMetadata();
}
