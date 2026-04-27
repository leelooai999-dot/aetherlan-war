import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');
const metadataDir = join(outputDir, 'metadata');
const framesDir = join(outputDir, 'frames');

async function loadJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function auditAssets() {
  await mkdir(outputDir, { recursive: true });
  const metadataFiles = (await readdir(metadataDir)).filter((f) => f.endsWith('.json'));
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCharacters: 0,
      ok: 0,
      warning: 0,
      error: 0
    },
    characters: []
  };

  for (const file of metadataFiles) {
    const metadata = await loadJson(join(metadataDir, file));
    const frameInfo = await loadJson(join(framesDir, metadata.characterId, 'frames.json'));
    const expectedFrames = metadata.mapModule.rows * metadata.mapModule.columns;
    const actualFrames = frameInfo.frames.length;
    const issues = [];

    if (actualFrames < expectedFrames) {
      issues.push({
        level: 'warning',
        code: 'FRAME_COUNT_MISMATCH',
        message: `expected ${expectedFrames} frames from config grid, found ${actualFrames}`
      });
    }

    for (const action of metadata.mapModule.actions) {
      const maxIndex = action.start + action.count - 1;
      if (maxIndex >= actualFrames) {
        issues.push({
          level: 'error',
          code: 'ACTION_OUT_OF_RANGE',
          message: `${action.id} expects frame index ${maxIndex}, but only ${actualFrames} frames exist`
        });
      }
    }

    const sheetStats = await stat(resolve(rootDir, 'config', metadata.inputs.mapSheet));
    const status = issues.some((issue) => issue.level === 'error') ? 'error' : issues.length ? 'warning' : 'ok';
    report.summary.totalCharacters += 1;
    report.summary[status] += 1;

    report.characters.push({
      characterId: metadata.characterId,
      displayName: metadata.displayName,
      status,
      expectedFrames,
      actualFrames,
      actions: metadata.mapModule.actions,
      sourceSheet: metadata.inputs.mapSheet,
      sourceBytes: sheetStats.size,
      issues
    });
  }

  await writeFile(join(outputDir, 'asset-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log('audit: asset-audit.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await auditAssets();
}
