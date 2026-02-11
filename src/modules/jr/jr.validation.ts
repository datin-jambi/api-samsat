import { z } from 'zod';

/**
 * Validation untuk query parameter GET /api/jr/detail?nopol=xxx
 */
export const getJrByNopolQuerySchema = z.object({
  query: z.object({
    nopol: z.string()
      .min(1, 'Nopol tidak boleh kosong')
      .max(20, 'Nopol maksimal 20 karakter')
      .refine(
        (val) => !val.includes('%') || /^[A-Z0-9\s]+$/.test(decodeURIComponent(val)),
        { message: 'Format encoding tidak valid. Gunakan spasi biasa atau format BH6869IK' }
      )
      .transform((val) => {
        // Decode jika ada encoding
        try {
          return val.includes('%') ? decodeURIComponent(val) : val;
        } catch {
          return val;
        }
      })
      .pipe(
        z.string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z0-9\s]+$/, 'Nopol hanya boleh mengandung huruf, angka, dan spasi')
          .transform((val) => val.replace(/\s+/g, '')) // Hapus semua spasi
          .refine(
            (val) => /^[A-Z]{1,2}\d{1,4}[A-Z]{1,3}$/.test(val),
            { message: 'Format nopol tidak valid (contoh: BH6869IK atau B1234ABC)' }
          )
      )
  })
});

/**
 * Type inference dari schema
 */
export type GetJrByNopolQuery = z.infer<typeof getJrByNopolQuerySchema>;
