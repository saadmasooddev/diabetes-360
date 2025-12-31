import { type Request, Response, NextFunction } from "express";
import { sendError } from "../../app/utils/response";
import { AppError } from "../errors";
import { ZodError } from "zod";
import { HTTP_STATUS } from "server/src/app/constants";

export function handleError(res: Response, error: any, data: any = null): void {
  console.log(error)
  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode, data);
    return;
  }
  if (error instanceof ZodError) {
    const messages = error.issues.map(i => i.message)
    const selectedMessage = messages.length > 0 ? messages[0] : "Validation error occured"
    sendError(res, selectedMessage, HTTP_STATUS.BAD_REQUEST);
    return;
  }

  const statusCode = error.status || error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  sendError(res, message, statusCode, data);
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  handleError(res, err);
}
