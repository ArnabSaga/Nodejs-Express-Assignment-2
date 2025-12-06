import { Response, NextFunction } from "express";

import { AuthRequest } from "./authMiddleware";

export const authorize =
  (...allowedRoles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (allowedRoles.length === 0) return next();

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
  };
