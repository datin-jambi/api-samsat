/**
 * Response Code Constants
 * Standarisasi code untuk response API
 */
export const ResponseCode = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ResponseCodeType = typeof ResponseCode[keyof typeof ResponseCode];
