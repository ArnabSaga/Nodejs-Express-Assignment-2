import { Response, NextFunction } from "express";

import { AuthRequest } from "./authMiddleware";

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: User not authenticated.",
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Insufficient role permissions.",
      });
    }

    next();
  };
};
