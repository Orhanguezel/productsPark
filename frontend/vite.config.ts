// vite.config.ts
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { PluginContext } from 'rollup';

/** paket@versiyon → paket (örn: "sonner@2.0.3" ⇒ "sonner") */
function stripVersionInImports(): Plugin {
  const re = /^(@[^/]+\/[^@/]+|[^@/]+)@\d+\.\d+\.\d+(\/.*)?$/;

  return {
    name: 'strip-version-in-imports',
    enforce: 'pre',
    async resolveId(this: PluginContext, source, importer, opts) {
      if (re.test(source)) {
        const cleaned = source.replace(/@\d+\.\d+\.\d+(?=\/|$)/, '');
        return this.resolve(cleaned, importer, { ...(opts ?? {}), skipSelf: true });
      }
      return null;
    },
  };
}

function trimSlash(x: string) {
  return x.replace(/\/+$/, '');
}

function isAbsUrl(x: string) {
  return /^https?:\/\//i.test(x);
}

/**
 * API_ORIGIN çözümü (senin env yapına göre):
 * - VITE_API_URL (absolute) varsa: origin kısmını alır (http://host:port)
 * - yoksa: http://127.0.0.1:8081 fallback
 */
function resolveApiOrigin(env: Record<string, string>): string {
  const apiUrl = (env.VITE_API_URL || '').trim();

  if (apiUrl && isAbsUrl(apiUrl)) {
    try {
      const u = new URL(apiUrl);
      return trimSlash(`${u.protocol}//${u.host}`);
    } catch {
      // ignore → fallback
    }
  }

  // default local backend origin
  return 'http://127.0.0.1:8081';
}

export default defineConfig(({ mode }) => {
  // .env yükle (VITE_ prefix’li değerler)
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const API_ORIGIN = resolveApiOrigin(env);
  const FUNCTIONS_PREFIX = (env.VITE_FUNCTIONS_PREFIX || '/functions').trim() || '/functions';

  return {
    plugins: [react(), stripVersionInImports()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),

        // version pinned imports (optional)
        'sonner@2.0.3': 'sonner',
        'lucide-react@0.487.0': 'lucide-react',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
      },
      // Tek kopya React ve Radix
      dedupe: [
        'react',
        'react-dom',
        '@radix-ui/react-dialog',
        '@radix-ui/react-primitive',
        '@radix-ui/react-slot',
        '@radix-ui/react-portal',
        '@radix-ui/react-use-escape-keydown',
      ],
    },
    server: {
      host: true,
      port: 3000,
      hmr: { overlay: false },
      cors: true,
      proxy: {
        '^/storage': {
          target: API_ORIGIN,
          changeOrigin: true,
        },
        '^/api': {
          target: API_ORIGIN,
          changeOrigin: true,
        },
        // functions prefix’i env ile yönet (default: /functions)
        [`^${FUNCTIONS_PREFIX}`]: {
          target: API_ORIGIN,
          changeOrigin: true,
        },
      },
    },
    preview: { host: true, port: 4173, cors: true },
  };
});
