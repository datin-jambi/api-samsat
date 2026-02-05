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
 * Validation untuk body POST /api/kendaraan/detail
 */
export const getKendaraanByNopolSchema = z.object({
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
export type GetAllKendaraanQuery = z.infer<typeof getAllKendaraanSchema>;
export type GetKendaraanByNopolBody = z.infer<typeof getKendaraanByNopolSchema>;
