import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const entries = [
  { name: 'content', entry: 'src/content/index.ts', outFile: 'content/index.js' },
  { name: 'injected', entry: 'src/injected/index.ts', outFile: 'injected/index.js' },
  { name: 'background', entry: 'src/background/service-worker.ts', outFile: 'background/service-worker.js' },
  { name: 'popup', entry: 'src/popup/popup.ts', outFile: 'popup/popup.js' },
];

async function buildAll() {
  console.log('Building SourceSnap extension...\n');

  // Clean and create dist
  const distDir = resolve(__dirname, 'dist');

  for (const { name, entry, outFile } of entries) {
    console.log(`Building ${name}...`);

    const outDir = resolve(distDir, dirname(outFile));

    await build({
      configFile: false,
      build: {
        outDir,
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, entry),
          name,
          formats: ['iife'],
          fileName: () => outFile.split('/').pop(),
        },
        rollupOptions: {
          output: {
            extend: true,
            // Don't add 'use strict' which can cause issues
            strict: false,
          },
        },
        target: 'esnext',
        minify: false,
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        },
      },
      logLevel: 'warn',
    });
  }

  // Copy static files
  console.log('\nCopying static files...');

  // manifest.json
  copyFileSync(
    resolve(__dirname, 'manifest.json'),
    resolve(distDir, 'manifest.json')
  );

  // popup/index.html
  mkdirSync(resolve(distDir, 'popup'), { recursive: true });
  copyFileSync(
    resolve(__dirname, 'src/popup/index.html'),
    resolve(distDir, 'popup/index.html')
  );

  // icons
  if (existsSync(resolve(__dirname, 'icons'))) {
    mkdirSync(resolve(distDir, 'icons'), { recursive: true });
    cpSync(
      resolve(__dirname, 'icons'),
      resolve(distDir, 'icons'),
      { recursive: true }
    );
  }

  console.log('\nBuild complete! Load dist/ folder in chrome://extensions');
}

buildAll().catch(console.error);
