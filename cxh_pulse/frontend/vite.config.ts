import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const PORT = Number(env.VITE_PORT) || 3039;
  const ALLOWED_HOSTS = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim())
    : ['localhost', '127.0.0.1'];

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@section': path.resolve(__dirname, './src/sections'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@theme': path.resolve(__dirname, './src/theme'),
      },
    },
    plugins: [
      react(),
      checker({
        typescript: true,
        eslint: {
          useFlatConfig: true,
          lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
          dev: { logLevel: ['error'] },
        },
        overlay: {
          position: 'tl',
          initialIsOpen: false,
        },
      }),
    ],
    server: {
      port: PORT,
      host: true,
      allowedHosts: ALLOWED_HOSTS,
    },
    preview: {
      port: PORT,
      host: true,
      allowedHosts: ALLOWED_HOSTS,
    },
    build: {
      minify: 'esbuild',
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('scaffolding/pages')) {
              const match = id.match(/scaffolding\/pages\/([^/]+)/);
              return match ? `scaffolding-pages-${match[1]}` : 'scaffolding-pages';
            }
            if (id.includes('scaffolding/sections')) {
              return 'scaffolding-sections';
            }
          },
        },
      },
    },
  };
});
