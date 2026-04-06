import { env } from '../../config/env';
import { JrApiRequest, JrApiResponse, JrResponse } from './jr.type';
import {
  buildJrRequestBody,
  getJrKendaraanData,
  JR_CONSTANTS,
  mapJrResponse,
} from './jr.service.util';

/**
 * Type untuk network error
 */
interface NetworkError extends Error {
  cause?: {
    code?: string;
    message?: string;
  };
  startTime?: number;
}

function toNetworkError(error: unknown): NetworkError {
  if (error instanceof Error) {
    return error as NetworkError;
  }

  return new Error('Unknown network error');
}

function isRetryableError(error: NetworkError): boolean {
  return error.name === 'AbortError'
    || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
    || error.cause?.code === 'ETIMEDOUT'
    || error.cause?.code === 'ECONNRESET'
    || error.cause?.code === 'ECONNREFUSED';
}

function buildJrConnectionError(error: NetworkError): Error {
  if (error.name === 'AbortError') {
    return new Error(
      `Request ke API JR timeout setelah ${JR_CONSTANTS.REQUEST_TIMEOUT_MS / 1000} detik. Server tidak merespon.`
    );
  }

  if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
    return new Error(
      `Koneksi ke API JR timeout. Server ${env.URL_JR} tidak merespon. `
      + 'Kemungkinan: server lambat/down, firewall blocking, atau network issue.'
    );
  }

  if (error.cause?.code === 'ENOTFOUND') {
    return new Error(`Domain API JR tidak ditemukan. Pastikan URL sudah benar: ${env.URL_JR}`);
  }

  if (error.cause?.code === 'ECONNREFUSED') {
    return new Error('Koneksi ke API JR ditolak. Server mungkin tidak aktif atau port salah.');
  }

  if (error.cause?.code === 'ETIMEDOUT') {
    return new Error('Timeout saat menghubungi API JR. Server tidak merespon.');
  }

  if (error.cause?.code === 'ECONNRESET') {
    return new Error('Koneksi ke API JR terputus. Server memutuskan koneksi.');
  }

  if (error.cause?.code === 'CERT_HAS_EXPIRED' || error.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    return new Error('SSL Certificate API JR bermasalah. Hubungi penyedia API JR');
  }

  if (error.message && !error.message.includes('fetch failed')) {
    return error;
  }

  return new Error(
    'Gagal terhubung ke API JR. '
    + `Error: ${error.message}. `
    + `Cause: ${error.cause?.code || error.cause?.message || 'Unknown'}. `
    + `URL: ${env.URL_JR}.`
  );
}

/**
 * Get JR by nopol
 * Ambil data kendaraan dulu, lalu hit API JR eksternal
 */
export async function getJrByNopol(nopol: string): Promise<JrResponse | null> {
  const kendaraan = await getJrKendaraanData(nopol);

  if (!kendaraan) {
    return null;
  }

  const requestBody: JrApiRequest = buildJrRequestBody(kendaraan);
  let lastError: unknown;

  for (let attempt = 1; attempt <= JR_CONSTANTS.MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), JR_CONSTANTS.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(env.URL_JR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API JR mengembalikan error (${response.status}): ${errorText || response.statusText}`);
      }

      const data = await response.json() as JrApiResponse[];
      if (!data || data.length === 0) {
        throw new Error('Response dari API JR kosong');
      }

      const jrData = data[0];
      if (jrData.MODE !== 'OK') {
        throw new Error(`API JR error: ${jrData.MSG}`);
      }

      return mapJrResponse(jrData);

    } catch (err: unknown) {
      lastError = err;
      const errorObj = toNetworkError(err);

      if (attempt < JR_CONSTANTS.MAX_RETRIES && isRetryableError(errorObj)) {
        const currentDelay = JR_CONSTANTS.BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        continue;
      }

      break;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw buildJrConnectionError(toNetworkError(lastError));
}
