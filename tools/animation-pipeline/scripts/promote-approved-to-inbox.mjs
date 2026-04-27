import { mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const packsRoot = join(rootDir, 'production-packs');
const inboxRoot = join(rootDir, 'inbox');

export async function promoteApprovedToInbox() {
  await mkdir(inboxRoot, { recursive: true });
  const characters = await readdir(packsRoot, { withFileTypes: true }).catch(() => []);
  let count = 0;

  for (const entry of characters) {
    if (!entry.isDirectory()) continue;
    const approvedDir = join(packsRoot, entry.name, 'approved');
    const inboxDir = join(inboxRoot, entry.name);
    await mkdir(inboxDir, { recursive: true });

    const files = await readdir(approvedDir).catch(() => []);
    for (const file of files) {
      const src = join(approvedDir, file);
      const st = await stat(src);
      if (!st.isFile()) continue;
      const dest = join(inboxDir, file);
      await copyFile(src, dest);
      count += 1;
    }
  }

  console.log(`promote: ${count} file(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await promoteApprovedToInbox();
}
