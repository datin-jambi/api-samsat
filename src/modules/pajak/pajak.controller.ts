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
 * GET /api/pajak/detail?nopol=xxx
 * Get pajak by nopol via query parameter (RESTful way)
 */
export async function getPajakByNopolQuery(req: Request, res: Response): Promise<void> {
  try {
    const { nopol } = req.query;

    // Validasi input (sudah ter-handle di validation middleware)
    if (!nopol || typeof nopol !== 'string') {
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