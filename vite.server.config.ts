import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist-server',
    lib: {
      entry: path.resolve(__dirname, 'server.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'server.js',
      },
      external: [
        'electron',
        'better-sqlite3',
        'ssh2',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
      ],
    },
    target: 'node20',
    minify: false,
    ssr: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
