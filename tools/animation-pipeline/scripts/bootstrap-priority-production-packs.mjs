import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');
const packsRoot = join(rootDir, 'production-packs');

export async function bootstrapPriorityProductionPacks() {
  const priority = JSON.parse(await readFile(join(outputDir, 'brief-priority.json'), 'utf8'));

  for (const top of priority.ranked.slice(0, 2)) {
    const packDir = join(packsRoot, top.characterId);
    await mkdir(join(packDir, 'incoming'), { recursive: true });
    await mkdir(join(packDir, 'reviewed'), { recursive: true });
    await mkdir(join(packDir, 'approved'), { recursive: true });
    await mkdir(join(packDir, 'exports'), { recursive: true });

    const readme = [
      `# ${top.displayName} Production Pack`,
      '',
      `Priority score: ${top.score}`,
      `Reason: ${top.reason}`,
      '',
      '## Folders',
      '- incoming: raw AI or artist deliveries',
      '- reviewed: manually checked candidates',
      '- approved: assets ready for runtime intake',
      '- exports: packaged deliverables',
      '- tasks: first-wave action task files',
      '',
      '## Flow',
      '1. drop new assets into incoming',
      '2. review quality and consistency',
      '3. move approved files into approved',
      '4. run `bash ../../scripts/advance-approved-assets.sh`',
      '5. inspect runtime gate, progress summary, and gap board',
      ''
    ].join('\n');

    await writeFile(join(packDir, 'README.md'), readme, 'utf8');
    console.log(`production-pack: ${top.characterId}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await bootstrapPriorityProductionPacks();
}
