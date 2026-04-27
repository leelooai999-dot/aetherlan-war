import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const configDir = join(rootDir, 'config');
const outputDir = join(rootDir, 'output');

export async function buildGenerationTasks() {
  await mkdir(outputDir, { recursive: true });
  const files = (await readdir(configDir)).filter((file) => file.startsWith('characters.') && file.endsWith('.json'));
  const tasks = [];

  for (const file of files) {
    const config = JSON.parse(await readFile(join(configDir, file), 'utf8'));
    tasks.push({
      characterId: config.characterId,
      displayName: config.displayName,
      style: config.generation.style,
      referenceImage: config.referenceImage,
      deliverables: [
        'master A-pose reference PNG',
        'map sprite sheet with idle/run/hit/death',
        'per-action metadata json',
        'transparent-background skill effect frames when needed'
      ],
      actions: Object.entries(config.generation.prompts).map(([action, prompt]) => ({
        action,
        prompt,
        outputHint: action === 'master' ? 'single transparent PNG' : 'animation frame sequence or sheet'
      })),
      technicalSpec: {
        mapFrameWidth: config.mapModule.frameWidth,
        mapFrameHeight: config.mapModule.frameHeight,
        expectedRows: config.mapModule.rows,
        expectedColumns: config.mapModule.columns,
        alphaBackground: true,
        consistentCharacterIdentity: true
      }
    });
  }

  await writeFile(join(outputDir, 'generation-tasks.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), tasks }, null, 2)}\n`, 'utf8');
  console.log('tasks: generation-tasks.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildGenerationTasks();
}
