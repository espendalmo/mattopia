import { access, cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [channel, destination, requestedVersion, sourceDirectory] = process.argv.slice(2);
const source = resolve(sourceDirectory || fileURLToPath(new URL('../', import.meta.url)));
const numericVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function replaceRequired(contents, pattern, replacement, filename) {
  if (!pattern.test(contents)) throw new Error(`Fant ikke versjonsfeltet i ${filename}.`);
  return contents.replace(pattern, replacement);
}

async function makeRelease() {
  if (!['stable', 'preview'].includes(channel) || !destination) {
    throw new Error('Bruk: node tools/release.mjs <stable|preview> <ny mappe> [versjon] [kildemappe]');
  }
  const target = resolve(destination);
  await access(target).then(
    () => { throw new Error(`Mappen finnes allerede: ${target}`); },
    error => { if (error.code !== 'ENOENT') throw error; },
  );
  const manifest = JSON.parse(await readFile(join(source, 'manifest.webmanifest'), 'utf8'));
  const core = await readFile(join(source, 'core.js'), 'utf8');
  const worker = await readFile(join(source, 'sw.js'), 'utf8');
  const html = await readFile(join(source, 'index.html'), 'utf8');
  const originalVersion = core.match(/export const VERSION\s*=\s*'([^']+)'/)?.[1];
  const version = requestedVersion || originalVersion;
  if (!numericVersion.test(version)) throw new Error('Versjonen må være et tall på formen 1.4.1.');
  const channelPattern = /export const CHANNEL\s*=\s*'(stable|preview)'/;
  if (channel === 'preview' && !channelPattern.test(core)) {
    throw new Error('Prøvepakker krever Tallvenn 1.4.0 eller nyere.');
  }
  if (manifest.id !== './' || manifest.start_url !== './' || manifest.scope !== './') {
    throw new Error('Manifestet må ha relative verdier for id, start_url og scope.');
  }

  const namedCore = replaceRequired(core, /export const VERSION\s*=\s*'[^']+'/, `export const VERSION='${version}'`, 'core.js')
    .replace(channelPattern, `export const CHANNEL = '${channel}'`);
  const namedWorker = replaceRequired(worker, /const VERSION\s*=\s*'[^']+'/, `const VERSION = '${version}'`, 'sw.js');
  const preview = channel === 'preview';
  if (preview) {
    manifest.name = 'Tallvenn Test';
    manifest.short_name = 'Tallvenn Test';
  }
  const namedHtml = preview
    ? html.replace('<head>', '<head>\n  <meta name="robots" content="noindex">')
          .replace('<title>Tallvenn', '<title>Tallvenn Test')
    : html;

  const files = await readdir(source, { withFileTypes:true });
  await mkdir(dirname(target), { recursive:true });
  const temporary = await mkdtemp(join(dirname(target), '.tallvenn-build-'));
  try {
    for (const file of files) {
      if (!file.isFile() || !/\.(css|js)$/.test(file.name) || ['core.js', 'sw.js'].includes(file.name)) continue;
      await cp(join(source, file.name), join(temporary, file.name));
    }
    await cp(join(source, 'assets'), join(temporary, 'assets'), { recursive:true });
    await writeFile(join(temporary, 'index.html'), namedHtml);
    await writeFile(join(temporary, 'core.js'), namedCore);
    await writeFile(join(temporary, 'sw.js'), namedWorker);
    await writeFile(join(temporary, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
    await writeFile(join(temporary, '.nojekyll'), '');
    await rename(temporary, target);
    console.log(`Tallvenn ${version} (${channel}) er klar i ${target}.`);
  } finally {
    await rm(temporary, { recursive:true, force:true });
  }
}

try {
  await makeRelease();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
