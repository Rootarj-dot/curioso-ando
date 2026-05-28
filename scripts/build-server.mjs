import { build } from 'esbuild';

await build({
  entryPoints: ['server/_core/index.ts'],
  bundle: true,
  platform: 'node',
  packages: 'external',
  format: 'esm',
  outdir: 'dist',
});
