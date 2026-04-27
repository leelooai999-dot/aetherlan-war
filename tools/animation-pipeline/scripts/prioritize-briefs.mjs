import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');

const priorityWeights = {
  samuel: 100,
  isolde: 90,
  'moon-deer': 70,
  'mutated-beast': 75,
};

export async function prioritizeBriefs() {
  const audit = JSON.parse(await readFile(join(outputDir, 'asset-audit.json'), 'utf8'));
  const ranked = audit.characters
    .map((character) => ({
      characterId: character.characterId,
      displayName: character.displayName,
      status: character.status,
      expectedFrames: character.expectedFrames,
      actualFrames: character.actualFrames,
      score: priorityWeights[character.characterId] ?? 50,
      reason:
        character.characterId === 'samuel'
          ? 'core humanoid battle presentation benchmark'
          : character.characterId === 'isolde'
            ? 'second hero-class benchmark for style consistency'
            : character.characterId === 'mutated-beast'
              ? 'enemy readability benchmark for combat feedback'
              : 'companion creature animation benchmark',
    }))
    .sort((a, b) => b.score - a.score);

  await writeFile(
    join(outputDir, 'brief-priority.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), ranked }, null, 2)}\n`,
    'utf8'
  );
  console.log('priority: brief-priority.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await prioritizeBriefs();
}
