#!/usr/bin/env node
/**
 * create-simple-photo-gallery — scaffold a fresh photo-gallery site.
 *
 *   npm create simple-photo-gallery@latest [dir] [flags]
 *
 * Downloads the simple-photo-gallery template at a pinned tag, strips the
 * demo content (the example photographs are not MIT-licensed), rewrites the
 * config from your answers, and leaves you one `git push` away from a
 * published GitHub Pages site.
 *
 * Flags (all optional; missing answers are prompted for on a TTY):
 *   --title <s>      site title
 *   --mode <m>       gallery | single | auto
 *   --chrome <c>     header | rail | frame
 *   --content <c>    placeholders | empty
 *   --ref <ref>      template git ref to scaffold from (default: pinned tag)
 *   --no-install     skip npm install
 *   --no-git         skip git init
 *   -y, --yes        accept defaults for everything not flagged
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync, execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import * as p from '@clack/prompts';
import { downloadTemplate } from 'giget';
import pc from 'picocolors';

/** The template tag this CLI version scaffolds. Bump together with releases. */
const TEMPLATE = 'arthursoares/simple-photo-gallery';
const TEMPLATE_REF = 'v0.2.1';

/* ----------------------------------------------------------- arg parsing */

const args = process.argv.slice(2);
const flags = { _: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-y' || a === '--yes') flags.yes = true;
  else if (a === '--no-install') flags.install = false;
  else if (a === '--no-git') flags.git = false;
  else if (a === '--help' || a === '-h') flags.help = true;
  else if (a.startsWith('--')) flags[a.slice(2)] = args[++i];
  else flags._.push(a);
}

if (flags.help) {
  console.log(
    'Usage: npm create simple-photo-gallery@latest [dir] ' +
      '[--title <s>] [--mode gallery|single|auto] [--chrome header|rail|frame] ' +
      '[--content placeholders|empty] [--ref <git-ref>] [--no-install] [--no-git] [-y]'
  );
  process.exit(0);
}

const interactive = process.stdout.isTTY && !flags.yes;
const cancel = (v) => {
  if (p.isCancel(v)) {
    p.cancel('Scaffold cancelled.');
    process.exit(1);
  }
  return v;
};

/* --------------------------------------------------------------- prompts */

p.intro(pc.inverse(' ▧ create-simple-photo-gallery '));

let dir = flags._[0];
if (!dir && interactive) {
  dir = cancel(
    await p.text({
      message: 'Where should the gallery live?',
      placeholder: './my-photos',
      defaultValue: './my-photos',
    })
  );
}
dir = path.resolve(dir || './my-photos');
if (existsSync(dir) && (await readdir(dir)).length > 0) {
  p.cancel(`${dir} already exists and is not empty.`);
  process.exit(1);
}

const title =
  flags.title ??
  (interactive
    ? cancel(await p.text({ message: 'Site title', defaultValue: 'Photos', placeholder: 'Photos' }))
    : 'Photos');

const mode =
  flags.mode ??
  (interactive
    ? cancel(
        await p.select({
          message: 'Site shape',
          options: [
            { value: 'auto', label: 'auto', hint: 'single when content is exactly one album, else gallery' },
            { value: 'gallery', label: 'gallery', hint: 'index of photos + albums, each album gets a page' },
            { value: 'single', label: 'single', hint: 'the whole site is one album' },
          ],
        })
      )
    : 'auto');

const chrome =
  flags.chrome ??
  (interactive
    ? cancel(
        await p.select({
          message: 'Site chrome',
          options: [
            { value: 'header', label: 'header', hint: 'slim top bar' },
            { value: 'rail', label: 'rail', hint: 'vertical left rail' },
            { value: 'frame', label: 'frame', hint: 'floating corner chips only' },
          ],
        })
      )
    : 'header');

const content =
  flags.content ??
  (interactive
    ? cancel(
        await p.select({
          message: 'Starting content',
          options: [
            { value: 'placeholders', label: 'generated placeholders', hint: 'demo images with EXIF, easy to delete' },
            { value: 'empty', label: 'empty', hint: 'just drop your photos in' },
          ],
        })
      )
    : 'placeholders');

const doInstall =
  flags.install ??
  (interactive
    ? cancel(await p.confirm({ message: 'Install dependencies?', initialValue: true }))
    : true);

const doGit =
  flags.git ??
  (interactive
    ? cancel(await p.confirm({ message: 'Initialize a git repository?', initialValue: true }))
    : true);

/* ------------------------------------------------------------- scaffold */

const ref = flags.ref ?? TEMPLATE_REF;
const s = p.spinner();

s.start(`Downloading template (${TEMPLATE}#${ref})`);
await downloadTemplate(`gh:${TEMPLATE}#${ref}`, { dir, force: true });
s.stop(`Template downloaded (${ref})`);

s.start('Removing demo content');
/* The example photographs are © the template author (not MIT) — a fresh
   scaffold must not inherit them. Same for the demo-specific pages. */
await rm(path.join(dir, 'src/content/photos'), { recursive: true, force: true });
await mkdir(path.join(dir, 'src/content/photos'), { recursive: true });
await rm(path.join(dir, 'src/content/pages'), { recursive: true, force: true });
await mkdir(path.join(dir, 'src/content/pages'), { recursive: true });
await rm(path.join(dir, 'src/pages/docs.astro'), { force: true });
await rm(path.join(dir, 'docs'), { recursive: true, force: true });

/* Draft starters: keep both content collections non-empty (avoids Astro's
   empty-collection warnings) and document the format in place. Drafts never
   publish — flip `draft: false` to use them. */
await writeFile(
  path.join(dir, 'src/content/photos/example-photo.md'),
  `---
# Sidecar example: metadata for a photo named example-photo.jpg next to this
# file. Works for loose photos and for photos inside album folders. Delete
# this file or keep it as a reference — drafts are never published.
title: Example photo
caption: A caption assembled into the caption bar
tags: [example]
draft: true
---
`
);
await writeFile(
  path.join(dir, 'src/content/pages/about.md'),
  `---
# A markdown file in this folder becomes a standalone page at /<filename>/
# and is linked from the site menu. Flip draft to false to publish this one.
title: About
description: Who makes these photographs.
mark: '✶'
draft: true
---

Write something about yourself here.
`
);
s.stop('Demo content removed');

s.start('Writing configuration');
const slug = path
  .basename(dir)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'my-photos';

let author = '';
try {
  author = execSync('git config user.name', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {}

const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const configPath = path.join(dir, 'gallery.config.ts');
let config = await readFile(configPath, 'utf8');
config = config
  .replace(/title: '[^']*'/, `title: '${esc(title)}'`)
  .replace(/description: '[^']*'/, "description: 'A photo gallery.'")
  .replace(/author: '[^']*'/, `author: '${esc(author || 'Your Name')}'`)
  .replace(/mode: '[^']*' as/, `mode: '${mode}' as`)
  .replace(/chrome: '[^']*' as/, `chrome: '${chrome}' as`)
  .replace(/nav: \[[\s\S]*?\] as \{ label: string; href: string \}\[\],/, 'nav: [] as { label: string; href: string }[],');
await writeFile(configPath, config);

const pkgPath = path.join(dir, 'package.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
pkg.name = slug;
pkg.version = '0.1.0';
pkg.description = `${title} — a photo gallery built with simple-photo-gallery.`;
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

/* Strip the example-photo carve-out from the LICENSE (no photos remain), but
   keep the MIT notice itself — it must travel with the code. */
const licensePath = path.join(dir, 'LICENSE');
if (existsSync(licensePath)) {
  const license = await readFile(licensePath, 'utf8');
  await writeFile(licensePath, license.split('\n---\n')[0].trimEnd() + '\n');
}

await writeFile(
  path.join(dir, 'README.md'),
  `# ${title}

A photo gallery built with [simple-photo-gallery](https://github.com/${TEMPLATE}).

## Photos

Drop images into \`src/content/photos/\` — a folder is an album, a loose file
is a single photo. Optional markdown (\`<album>/index.md\`, \`<photo>.md\`)
adds titles, captions, ordering, writeups, and drafts. Markdown files in
\`src/content/pages/\` become standalone pages linked from the menu.
Site settings live in \`gallery.config.ts\`.

Full documentation: https://arthursoares.github.io/simple-photo-gallery/docs/

## Develop

\`\`\`bash
npm install
npm run dev        # http://localhost:4321
npm run demo       # generate placeholder photos if the folder is empty
\`\`\`

## Publish (GitHub Pages)

1. Create a GitHub repository and push this folder to it.
2. In the repository: Settings → Pages → Build and deployment → Source →
   **GitHub Actions**.
3. Push to \`main\` — the bundled workflow builds and deploys on every push.
`
);
s.stop('Configuration written');

if (doInstall) {
  /* Respect the package manager that invoked us (npm/pnpm/yarn/bun create). */
  const ua = process.env.npm_config_user_agent || '';
  const pm = ua.startsWith('pnpm') ? 'pnpm' : ua.startsWith('yarn') ? 'yarn' : ua.startsWith('bun') ? 'bun' : 'npm';
  s.start(`Installing dependencies (${pm})`);
  execFileSync(pm, ['install'], { cwd: dir, stdio: 'ignore' });
  s.stop('Dependencies installed');

  if (content === 'placeholders') {
    s.start('Generating placeholder photos');
    execFileSync('node', ['scripts/make-demo-photos.mjs'], { cwd: dir, stdio: 'ignore' });
    s.stop('Placeholder photos generated');
  }
} else if (content === 'placeholders') {
  p.log.info('Run `npm install && npm run demo` to generate the placeholder photos.');
}

if (doGit) {
  try {
    execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['add', '-A'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-q', '-m', 'Scaffold simple-photo-gallery site'], {
      cwd: dir,
      stdio: 'ignore',
    });
    s.stop;
    p.log.success('Git repository initialized');
  } catch {
    p.log.warn('Could not initialize git (is git installed/configured?). Skipping.');
  }
}

const relPath = path.relative(process.cwd(), dir) || '.';
const rel = relPath.startsWith('..') ? dir : relPath;
p.note(
  [
    `cd ${rel}`,
    ...(doInstall ? [] : ['npm install']),
    'npm run dev                  # preview locally',
    '',
    '# publish:',
    `gh repo create ${slug} --private --source . --push`,
    '#   …or create a repo on github.com and push',
    '# then: Settings → Pages → Source → "GitHub Actions"',
  ].join('\n'),
  'Next steps'
);
p.outro(`${pc.yellow('░▒▓')} done ${pc.yellow('▓▒░')}`);
