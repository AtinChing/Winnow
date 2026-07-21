import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src/manifest.json', 'dist/manifest.json');
await cp('src/popup/popup.html', 'dist/popup.html');
await cp('src/options/options.html', 'dist/options.html');

await build({
  entryPoints: {
    'background/service-worker': 'src/background/service-worker.ts'
  },
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  target: 'es2022',
  sourcemap: true
});

await build({
  entryPoints: {
    'content/content': 'src/content/content.ts',
    'popup/popup': 'src/popup/popup.ts',
    'options/options': 'src/options/options.ts'
  },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'es2022',
  sourcemap: true
});
