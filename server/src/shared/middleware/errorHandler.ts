import { type Request, Response, NextFunction } from "express";
import { sendError } from "../../app/utils/response";
import { AppError } from "../errors";
import { ZodError } from "zod";

export function handleError(res: Response, error: any, data: any = null): void {
  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode, data);
    return;
  }
  if (error instanceof ZodError) {
    const zodMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    sendError(res, zodMessage, 400, data);
    return;
  }
  const statusCode = error.status || error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  sendError(res, message, statusCode, data);
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.log(err.message)
  handleError(res, err);
}
