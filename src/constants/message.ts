/**
 * Message Constants
 * Standarisasi pesan untuk response API
 */
export const Message = {
  // Success
  SUCCESS: 'Berhasil',
  DATA_FOUND: 'Data ditemukan',
  DATA_NOT_FOUND: 'Data tidak ditemukan',

  // Error
  INTERNAL_ERROR: 'Terjadi kesalahan pada server',
  INVALID_REQUEST: 'Request tidak valid',
  
  // Auth
  UNAUTHORIZED: 'API Key tidak valid',
  FORBIDDEN: 'Akses ditolak',
  API_KEY_REQUIRED: 'API Key diperlukan',

  // Not Found
  ROUTE_NOT_FOUND: 'Endpoint tidak ditemukan',
} as const;
