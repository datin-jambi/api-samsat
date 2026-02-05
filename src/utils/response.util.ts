import { Response } from 'express';

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
  errors?: any;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPage: number;
}

/**
 * Response dengan pagination
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Helper untuk membuat response sukses (detail/single data)
 * 
 * @param res - Express response object
 * @param data - Data yang akan dikirim
 * @param message - Pesan sukses (default: "Success")
 * @param statusCode - HTTP status code (default: 200)
 */
export function successResponse<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    status: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

/**
 * Helper untuk membuat response sukses dengan pagination
 * 
 * @param res - Express response object
 * @param items - Array data
 * @param pagination - Metadata pagination
 * @param message - Pesan sukses (default: "Success")
 */
export function successResponseWithPagination<T>(
  res: Response,
  items: T[],
  pagination: PaginationMeta,
  message: string = 'Success'
): void {
  const response: ApiResponse<PaginatedData<T>> = {
    status: true,
    message,
    data: {
      items,
      pagination,
    },
  };
  res.status(200).json(response);
}

/**
 * Helper untuk membuat pagination metadata
 */
export function createPagination(
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta {
  return {
    page,
    limit,
    totalItems,
    totalPage: Math.ceil(totalItems / limit),
  };
}

/**
 * Helper untuk membuat response error (400 Bad Request)
 */
export function badRequestResponse(
  res: Response,
  message: string = 'Bad Request',
  errors?: any
): void {
  const response: ApiResponse = {
    status: false,
    message,
    errors,
  };
  res.status(400).json(response);
}

/**
 * Helper untuk membuat response unauthorized (401)
 */
export function unauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized',
  errors?: any
): void {
  const response: ApiResponse = {
    status: false,
    message,
    errors,
  };
  res.status(401).json(response);
}

/**
 * Helper untuk membuat response forbidden (403)
 */
export function forbiddenResponse(
  res: Response,
  message: string = 'Forbidden',
  errors?: any
): void {
  const response: ApiResponse = {
    status: false,
    message,
    errors,
  };
  res.status(403).json(response);
}

/**
 * Helper untuk membuat response not found (404)
 */
export function notFoundResponse(
  res: Response,
  message: string = 'Data tidak ditemukan',
  errors?: any
): void {
  const response: ApiResponse = {
    status: false,
    message,
    errors,
  };
  res.status(404).json(response);
}

/**
 * Helper untuk membuat response validation error (422)
 */
export function validationErrorResponse(
  res: Response,
  errors: any,
  message: string = 'Validation Error'
): void {
  const response: ApiResponse = {
    status: false,
    message,
    errors,
  };
  res.status(422).json(response);
}

/**
 * Helper untuk membuat response server error (500)
 */
export function errorResponse(
  res: Response,
  message: string = 'Internal Server Error',
  errors?: any,
  statusCode: number = 500
): void {
  const response: ApiResponse = {
    status: false,
    message,
    errors,
  };
  res.status(statusCode).json(response);
}
