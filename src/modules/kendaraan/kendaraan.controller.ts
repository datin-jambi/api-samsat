import { Request, Response } from 'express';
import { 
  successResponse, 
  successResponseWithPagination,
  notFoundResponse, 
  errorResponse,
  badRequestResponse,
  createPagination 
} from '../../utils/response.util';
import { Message } from '../../constants/message';
import * as kendaraanService from './kendaraan.service';

/**
 * Kendaraan Controller
 * 
 * Handle HTTP request & response
 * Validasi input dari user
 * Panggil service untuk business logic
 */

/**
 * GET /api/kendaraan?page=1&limit=10
 * Get all kendaraan dengan pagination
 */
export async function getAllKendaraan(req: Request, res: Response): Promise<void> {
  try {
    // Ambil query parameter
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    // Validasi
    if (page < 1 || limit < 1) {
      badRequestResponse(res, 'Page dan limit harus lebih dari 0');
      return;
    }

    // Panggil service
    const kendaraanList = await kendaraanService.getAllKendaraan(limit);

    // Buat pagination metadata
    const pagination = createPagination(page, limit, kendaraanList.length);

    // Kirim response dengan pagination
    successResponseWithPagination(res, kendaraanList, pagination, Message.DATA_FOUND);
  } catch (error: unknown) {
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error))
      : Message.INTERNAL_ERROR;
    errorResponse(res, errorMessage, process.env.NODE_ENV === 'development' ? { detail: error instanceof Error ? error.message : String(error) } : undefined);
  }
}

/**
 * GET /api/kendaraan/detail
 * Get kendaraan by nopol
 */
export async function getKendaraanByNopol(req: Request, res: Response): Promise<void> {
  try {
    const { nopol } = req.body;

    // Validasi input
    if (!nopol) {
      badRequestResponse(res, 'Nopol tidak boleh kosong');
      return;
    }

    // Panggil service
    const kendaraan = await kendaraanService.getKendaraanByNopol(nopol);

    // Cek hasil
    if (!kendaraan) {
      notFoundResponse(res, 'Kendaraan tidak ditemukan');
      return;
    }

    // Kirim response
    successResponse(res, kendaraan, Message.DATA_FOUND);
  } catch (error: unknown) {
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error))
      : Message.INTERNAL_ERROR;
    errorResponse(res, errorMessage, process.env.NODE_ENV === 'development' ? { detail: error instanceof Error ? error.message : String(error) } : undefined);
  }
}

export async function getPnbpKendaraan(req: Request, res: Response): Promise<void> {
  try {
    const { nopol } = req.body;

    // Validasi input
    if (!nopol) {
      badRequestResponse(res, 'Nopol tidak boleh kosong');
      return;
    }

    // Panggil service
    const kendaraan = await kendaraanService.getPnbpKendaraan(nopol);

    // Cek hasil
    if (!kendaraan) {
      notFoundResponse(res, 'Kendaraan tidak ditemukan');
      return;
    }

    // Kirim response
    successResponse(res, kendaraan, Message.DATA_FOUND);
  } catch (error: unknown) {
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error))
      : Message.INTERNAL_ERROR;
    errorResponse(res, errorMessage, process.env.NODE_ENV === 'development' ? { detail: error instanceof Error ? error.message : String(error) } : undefined);
  }
}