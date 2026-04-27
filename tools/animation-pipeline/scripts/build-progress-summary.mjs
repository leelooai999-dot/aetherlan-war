import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');

export async function buildProgressSummary() {
  const matrix = JSON.parse(await readFile(join(outputDir, 'gap-matrix.json'), 'utf8'));

  const rows = matrix.rows.map((row) => {
    const totalActions = Object.keys(row.actions).length;
    const presentActions = Object.values(row.actions).filter((state) => state === 'present').length;
    const percent = totalActions === 0 ? 0 : Math.round((presentActions / totalActions) * 100);
    return {
      characterId: row.characterId,
      displayName: row.displayName,
      status: row.status,
      presentActions,
      totalActions,
      completionPercent: percent,
    };
  });

  const overall = rows.length === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + row.completionPercent, 0) / rows.length);
  const payload = {
    generatedAt: new Date().toISOString(),
    overallCompletionPercent: overall,
    rows,
  };

  await writeFile(join(outputDir, 'progress-summary.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('progress: progress-summary.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildProgressSummary();
}
