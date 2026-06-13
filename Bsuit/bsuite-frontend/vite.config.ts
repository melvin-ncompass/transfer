import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function resolveProxyTarget(env: Record<string, string>): string | undefined {
  const raw = env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL
  if (!raw?.trim()) return undefined
  try {
    return new URL(raw).origin
  } catch {
    return raw.replace(/\/$/, '')
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = resolveProxyTarget(env)

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['bsuite-dev.nclabs.tech', '*', '.bsuite-dev.nclabs.tech'],
      proxy: proxyTarget
        ? {
            '/socket.io': {
              target: proxyTarget,
              changeOrigin: true,
              ws: true,
              secure: true,
            },
          }
        : undefined,
    },
  }
})
