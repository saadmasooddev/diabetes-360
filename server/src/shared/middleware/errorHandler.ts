import { type Request, Response, NextFunction } from "express";
import { sendError } from "../../app/utils/response";
import { AppError } from "../errors";
import { ZodError } from "zod";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.log(err.message)
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    return sendError(res, err.message, 400);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  sendError(res, message, statusCode);
}
