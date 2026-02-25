// src/core/error.ts
// Fastify v5 ile bazı projelerde TS çözümlemesi şaşabiliyor.
// Burada 'any' verip üretimi engelleyen tip sürtünmesini kesiyoruz.

/** Static file extensions that should NOT trigger SPA fallback */
const STATIC_EXT =
  /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|webp|avif|mp4|webm|pdf|zip|gz)$/i;

function isApiOrAssetPath(url: string): boolean {
  const path = url.split('?')[0];
  if (path.startsWith('/api/')) return true;
  if (path.startsWith('/uploads/')) return true;
  if (path.startsWith('/storage/')) return true;
  if (STATIC_EXT.test(path)) return true;
  return false;
}

export function registerErrorHandlers(
  app: any,
  spaHandler?: (req: any, reply: any) => Promise<void>,
) {
  // 404
  app.setNotFoundHandler(async (req: any, reply: any) => {
    // SPA fallback: serve index.html with meta tags for page requests
    if (spaHandler && req.method === 'GET' && !isApiOrAssetPath(req.url)) {
      return spaHandler(req, reply);
    }

    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: 'Not Found', path: req.url },
    });
  });

  // Genel hata yakalayıcı
  app.setErrorHandler((err: any, req: any, reply: any) => {
    const status = err?.statusCode ?? err?.status ?? (err?.validation ? 400 : 500);

    const payload: Record<string, any> = {
      error: {
        code: err?.validation
          ? 'VALIDATION_ERROR'
          : err?.code ?? (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
        message: err?.message ?? 'Server Error',
      },
    };

    if (err?.validation) payload.error.details = err.validation;
    if (err?.errors) payload.error.details = err.errors;

    if (process.env.NODE_ENV !== 'production' && err?.stack) {
      payload.error.stack = err.stack;
    }

    req.log?.error?.(err, 'request_failed');
    reply.code(status).send(payload);
  });
}
