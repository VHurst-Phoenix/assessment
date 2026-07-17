import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

/**
 * Local dev-only proxy so the React app can send email without exposing
 * the Resend key to the browser or requiring a deployed Supabase function.
 */
function emailApiPlugin(mode) {
  return {
    name: 'email-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/send-email' || req.method !== 'POST') {
          next();
          return;
        }

        const env = loadEnv(mode, server.config.root, '');
        const apiKey = env.VITE_RESEND_API_KEY;
        const useSandbox = env.VITE_RESEND_USE_SANDBOX !== 'false';
        const fromEmail =
          mode === 'development' && useSandbox
            ? 'onboarding@resend.dev'
            : env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'VITE_RESEND_API_KEY is missing from .env' }));
          return;
        }

        try {
          const rawBody = await readRequestBody(req);
          const payload = JSON.parse(rawBody || '{}');
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: payload.to,
              subject: payload.subject,
              html: payload.html,
              text: payload.text,
            }),
          });

          const data = await response.json().catch(() => null);
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify(
              response.ok ? data : { error: data?.message || data?.error || 'Failed to send email' }
            )
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), emailApiPlugin(mode)],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vite 8 / rolldown requires manualChunks as a function
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
}));
