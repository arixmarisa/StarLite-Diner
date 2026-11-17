import { z } from 'zod';

export const API_PREFIX = '/api/v1';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('starlite-api'),
  version: z.literal('0.1.0'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
