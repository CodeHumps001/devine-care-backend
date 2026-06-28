import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";

import {
  clockIn,
  clockOut,
  getMyAttendance,
  getDepartmentAttendance,
  updateAttendance,
} from "./attendance.service";

const attendIn = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const userId = req.user.id as string;
    const { latitude, longitude } = req.body;
    const data = await clockIn(userId, latitude, longitude);

    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const attendOut = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }

    const userId = req.user.id as string;
    const data = await clockOut(userId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const myAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }

    const userId = req.user.id as string;
    const data = await getMyAttendance(userId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const viewAttendanceByDepId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }

    const departmentId = req.params.departmentId as string;
    const data = await getDepartmentAttendance(departmentId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const manualOveride = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }

    const id = req.params.id as string;
    const { status } = req.body;
    const data = await updateAttendance(id, status);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export {
  attendIn,
  attendOut,
  myAttendance,
  viewAttendanceByDepId,
  manualOveride,
};
