import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err);

  const status = err.status || 500;

  const message = err.message || "Internal Server Error";

  res.status(status).json({ success: false, message, errors: err.errors || null });
};
