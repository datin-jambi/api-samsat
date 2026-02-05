import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError, ZodRawShape } from 'zod';
import { badRequestResponse } from '../utils/response.util';

/**
 * Validation Middleware
 * 
 * Middleware untuk validasi request menggunakan Zod schema
 */

/**
 * Validate request dengan Zod schema
 * @param schema - Zod schema untuk validasi
 * @returns Express middleware
 */
export const validate = (schema: ZodObject<ZodRawShape>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validasi request (body, query, params)
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Jika validasi berhasil, lanjut ke handler berikutnya
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format error dari Zod
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        // Kirim bad request response
        badRequestResponse(
          res,
          'Validasi gagal',
          { errors }
        );
      } else {
        // Error lain
        badRequestResponse(res, 'Validasi gagal');
      }
    }
  };
};
