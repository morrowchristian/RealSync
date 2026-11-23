import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    root: './',
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000,
    },
    // Expose the API base URL as process.env.VITE_API_URL so axios.ts can
    // read it without `import.meta` (which Jest's CommonJS transform cannot
    // parse). Defaults to localhost in dev; set VITE_API_URL in .env or the
    // deployment environment to point at the deployed backend.
    define: {
      'process.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL ?? 'http://localhost:8000/api/'
      ),
    },
  };
});