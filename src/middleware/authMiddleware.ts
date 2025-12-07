import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

import config from "../config";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Missing authorization header",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token is missing from header",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret!) as {
      id: string | number;
      role: string;
    };

    // normalize id to string to make downstream comparisons consistent
    req.user = { id: String(decoded.id), role: decoded.role };
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
