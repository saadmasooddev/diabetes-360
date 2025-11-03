import { type Response } from "express";

export interface ApiResponse<T = any> {
  status: number;
  success: boolean;
  data?: T;
  message: string;
}

export function sendSuccess<T>(res: Response, data: T, message: string, statusCode = 200): void {
  const response: ApiResponse<T> = {
    status: statusCode,
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, statusCode = 500, data: any = null): void {
  const response: ApiResponse = {
    status: statusCode,
    success: false,
    message: message,
    data: data
  };
  res.status(statusCode).json(response);
}
