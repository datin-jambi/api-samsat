import { Request, Response } from 'express';
import { 
  successResponse, 
  notFoundResponse, 
  errorResponse,
  badRequestResponse,
} from '../../utils/response.util';
import { Message } from '../../constants/message';
import * as JrService from './jr.service';


/**
 * GET /api/jr/detail
 * Get jr by nopol
 */
export async function getJrByNopol(req: Request, res: Response): Promise<void> {
  try {
    const { nopol } = req.body;

    // Validasi input
    if (!nopol) {
      badRequestResponse(res, 'Nopol tidak boleh kosong');
      return;
    }

    // Panggil service
    const jr = await JrService.getJrByNopol(nopol);

    // Cek hasil
    if (!jr) {
      notFoundResponse(res, 'Jr tidak ditemukan');
      return;
    }

    // Kirim response
    successResponse(res, jr, Message.DATA_FOUND);
  } catch (error: any) {
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : Message.INTERNAL_ERROR;
    errorResponse(res, errorMessage, process.env.NODE_ENV === 'development' ? { detail: error.message } : undefined);
  }
}