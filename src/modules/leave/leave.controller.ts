import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import {
  createLeave,
  getMyLeave,
  getDepartmentLeave,
  reviewLeave,
} from "./leave.service";

const applyLeave = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const userId = req.user.id as string;
    const { leaveType, startDate, endDate, reason } = req.body;
    const data = await createLeave(
      userId,
      leaveType,
      startDate,
      endDate,
      reason,
    );
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const myLeave = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const userId = req.user.id as string;
    const data = await getMyLeave(userId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const departmentLeave = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const departmentId = req.user.departmentId as string;
    const data = await getDepartmentLeave(departmentId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const leaveReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const id = req.params.id as string;
    const { reviewNote, status } = req.body;
    const reviewedBy = req.user.id as string;
    const data = await reviewLeave(id, status, reviewedBy, reviewNote);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export { applyLeave, myLeave, departmentLeave, leaveReview };
