import { z } from 'zod';

/**
 * Validation untuk body POST /api/jr/detail
 */
export const getJrByNopolSchema = z.object({
  body: z.object({
    nopol: z.string()
      .min(1, 'Nopol tidak boleh kosong')
      .max(15, 'Nopol maksimal 15 karakter')
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9\s]+$/, 'Nopol hanya boleh mengandung huruf, angka, dan spasi')
  })
});

/**
 * Type inference dari schema
 */
export type GetJrByNopolBody = z.infer<typeof getJrByNopolSchema  >;
