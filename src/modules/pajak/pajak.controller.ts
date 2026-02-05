import { Request, Response } from 'express';
import { 
  successResponse, 
  notFoundResponse, 
  errorResponse,
  badRequestResponse,
} from '../../utils/response.util';
import { Message } from '../../constants/message';
import * as PajakService from './pajak.service';


/**
 * GET /api/pajak/detail
 * Get pajak by nopol
 */
export async function getPajakByNopol(req: Request, res: Response): Promise<void> {
  try {
    const { nopol } = req.body;

    // Validasi input
    if (!nopol) {
      badRequestResponse(res, 'Nopol tidak boleh kosong');
      return;
    }

    // Panggil service
    const pajak = await PajakService.getPajakByNopol(nopol);

    // Cek hasil
    if (!pajak) {
      notFoundResponse(res, 'Pajak tidak ditemukan');
      return;
    }

    // Kirim response
    successResponse(res, pajak, Message.DATA_FOUND);
  } catch (error: any) {
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : Message.INTERNAL_ERROR;
    errorResponse(res, errorMessage, process.env.NODE_ENV === 'development' ? { detail: error.message } : undefined);
  }
}