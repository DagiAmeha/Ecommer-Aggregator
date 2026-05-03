import { Response } from "express";

type SuccessResponse<T> = {
  status: "success";
  data: T;
};

type ErrorResponse = {
  status: "error";
  message: string;
  details?: string;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
): Response<SuccessResponse<T>> {
  return res.status(statusCode).json({
    status: "success",
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  details?: string,
): Response<ErrorResponse> {
  return res.status(statusCode).json({
    status: "error",
    message,
    ...(details ? { details } : {}),
  });
}
