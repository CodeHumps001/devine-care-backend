import { Role } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
    position: string;
    departmentId: string | null;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    //1: read token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "failed", message: "token not found" });
    }
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: Role;
      position: string;
      departmentId: string | null;
    };

    req.user = {
      id: decoded.id,
      role: decoded.role,
      position: decoded.position,
      departmentId: decoded.departmentId,
    };
    next();
  } catch (err: any) {
    return res
      .status(401)
      .json({ status: "failed", message: "Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: "failed", message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "failed",
        message: "You are not allowed to access this route",
      });
    }
    next();
  };
};
