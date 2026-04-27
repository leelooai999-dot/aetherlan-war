import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');

export async function buildGapMatrix() {
  const audit = JSON.parse(await readFile(join(outputDir, 'asset-audit.json'), 'utf8'));
  const matrix = {
    generatedAt: new Date().toISOString(),
    rows: audit.characters.map((character) => {
      const actionState = {};
      for (const action of character.actions) {
        const end = action.start + action.count - 1;
        actionState[action.id] = end < character.actualFrames ? 'present' : 'missing';
      }
      return {
        characterId: character.characterId,
        displayName: character.displayName,
        status: character.status,
        expectedFrames: character.expectedFrames,
        actualFrames: character.actualFrames,
        actions: actionState,
      };
    })
  };

  await writeFile(join(outputDir, 'gap-matrix.json'), `${JSON.stringify(matrix, null, 2)}\n`, 'utf8');
  console.log('gap: gap-matrix.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildGapMatrix();
}
