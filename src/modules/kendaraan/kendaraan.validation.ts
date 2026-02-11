import { z } from 'zod';

/**
 * Kendaraan Validation Schemas
 * 
 * Validation menggunakan Zod untuk module kendaraan
 */

/**
 * Validation untuk query parameter GET /api/kendaraan
 */
export const getAllKendaraanSchema = z.object({
  query: z.object({
    page: z.string().optional().refine(
      (val) => !val || parseInt(val) > 0,
      { message: 'Page harus lebih dari 0' }
    ),
    limit: z.string().optional().refine(
      (val) => !val || (parseInt(val) > 0 && parseInt(val) <= 100),
      { message: 'Limit harus antara 1-100' }
    )
  })
});

/**
 * Validation untuk query parameter GET /api/kendaraan/detail?nopol=xxx
 */
export const getKendaraanByNopolQuerySchema = z.object({
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
export type GetAllKendaraanQuery = z.infer<typeof getAllKendaraanSchema>;
export type GetKendaraanByNopolQuery = z.infer<typeof getKendaraanByNopolQuerySchema>;
