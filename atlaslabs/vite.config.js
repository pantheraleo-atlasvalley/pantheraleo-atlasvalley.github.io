import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    outDir: 'build',
    emptyOutDir: true,
    lib: {
      entry: 'src/main.js',
      name: 'AtlasWalletLogin',
      formats: ['iife'],
      fileName: () => 'wallet-app.bundle.js',
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
