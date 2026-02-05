import { z } from 'zod';

/**
 * Validation untuk body POST /api/pajak/detail
 */
export const getPajakByNopolSchema = z.object({
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
export type GetPajakByNopolBody = z.infer<typeof getPajakByNopolSchema  >;
