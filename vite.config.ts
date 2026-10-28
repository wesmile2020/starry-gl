import { defineConfig } from 'vite';
import * as path from 'path';
import glsl from 'vite-plugin-glsl';
import checker from 'vite-plugin-checker';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies);
const globals: Record<string, string> = {};
for (let i = 0; i < dependencies.length; i += 1) {
  globals[dependencies[i]] = dependencies[i];
}

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      name: 'StarryGL',
      fileName: 'starry-gl',
    },
    sourcemap: true,
    rolldownOptions: {
      external: dependencies,
      output: {
        globals: {
          ...globals,
        },
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '~': path.resolve(import.meta.dirname),
    },
  },
  plugins: [
    glsl({
      minify: process.env.NODE_ENV === 'production',
    }),
    checker({
      typescript: true,
      // eslint: {
      //   lintCommand: 'eslint ./src/**/*.{ts,tsx}',
      //   useFlatConfig: true,
      // },
    }),
  ],
  server: {
    open: '/debug/index.html'
  },
});
