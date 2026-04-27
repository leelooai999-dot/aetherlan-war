import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const configDir = join(rootDir, 'config');
const outputDir = join(rootDir, 'output', 'atlas');

async function loadConfigs() {
  const files = (await readdir(configDir)).filter((file) => file.startsWith('characters.') && file.endsWith('.json'));
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(join(configDir, file), 'utf8'))));
}

export async function packAtlas() {
  await mkdir(outputDir, { recursive: true });
  const configs = await loadConfigs();

  for (const config of configs) {
    const atlasPlan = {
      characterId: config.characterId,
      atlasImage: `atlases/${config.characterId}-map-atlas.png`,
      atlasData: `atlases/${config.characterId}-map-atlas.json`,
      sourceSheets: [
        {
          type: 'map',
          path: config.mapModule.sheet,
          frameWidth: config.mapModule.frameWidth,
          frameHeight: config.mapModule.frameHeight,
          rows: config.mapModule.rows,
          columns: config.mapModule.columns
        }
      ],
      effects: config.performanceModule.actions.map((action) => ({
        id: action.id,
        source: action.source,
        packaging: action.type === 'video' ? 'standalone' : 'atlas-candidate'
      })),
      notes: [
        'This file is a pack plan for a later TexturePacker or custom Python pack step.',
        'Current pipeline preserves existing sources and emits normalized pack metadata.'
      ]
    };

    const outPath = join(outputDir, `${config.characterId}.atlas-plan.json`);
    await writeFile(outPath, `${JSON.stringify(atlasPlan, null, 2)}\n`, 'utf8');
    console.log(`atlas plan: ${basename(outPath)}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await packAtlas();
}
