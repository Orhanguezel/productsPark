// src/modules/storage/controller.ts
import type { RouteHandler } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/core/env';

function ensureCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = env.CLOUDINARY;
  if (!cloudName || !apiKey || !apiSecret) {
    const err: any = new Error('cloudinary_not_configured');
    err.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw err;
  }
  // Idempotent config
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

function toPublicUrl(bucket: string, path: string) {
  const { basePublic, cloudName } = env.CLOUDINARY;
  const cleanPath = `${bucket}/${path}`.replace(/\\/g, '/');
  if (basePublic) return `${basePublic}/${cleanPath}`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${cleanPath}`;
}

async function uploadToCloudinary(
  file: MultipartFile,
  bucket: string,
  path: string
): Promise<{ key: string; path: string; url: string }> {
  ensureCloudinaryConfigured();

  const public_id = `${bucket}/${path}`.replace(/\\/g, '/');

  await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id, overwrite: true, resource_type: 'image' }, // gerekirse "auto"
      (err, res) => (err || !res ? reject(err || new Error('upload_failed')) : resolve(res))
    );
    file.file.pipe(stream); // Fastify multipart stream
  });

  return { key: public_id, path, url: toPublicUrl(bucket, path) };
}

/** GET /storage/v1/object/public/* → Cloudinary public URL’ine redirect */
export const publicRedirect: RouteHandler = async (req, reply) => {
  const star = (req.params as any)['*'] as string | undefined;
  if (!star) return reply.code(400).send({ error: { message: 'invalid_path' } });

  const [bucket, ...rest] = star.split('/');
  if (!bucket || rest.length === 0) {
    return reply.code(400).send({ error: { message: 'invalid_path' } });
  }
  const path = rest.join('/');
  return reply.redirect(toPublicUrl(bucket, path));
};

/** POST /storage/v1/object/*  (multipart/form-data; field: "file") */
export const handleUpload: RouteHandler = async (req, reply) => {
  try {
    const file = await (req as any).file(); // @fastify/multipart
    if (!file) return reply.code(400).send({ error: { message: 'file_required' } });

    const star = (req.params as any)['*'] as string | undefined;
    if (!star) return reply.code(400).send({ error: { message: 'invalid_path' } });

    const [bucket, ...rest] = star.split('/');
    if (!bucket || rest.length === 0) {
      return reply.code(400).send({ error: { message: 'invalid_path' } });
    }
    const path = rest.join('/');

    const data = await uploadToCloudinary(file, bucket, path);
    return reply.send({ data });
  } catch (e: any) {
    if (e?.code === 'CLOUDINARY_NOT_CONFIGURED') {
      return reply.code(500).send({ error: { message: 'cloudinary_not_configured' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'upload_failed' } });
  }
};
