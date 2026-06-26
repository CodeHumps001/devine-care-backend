import { Request, Response, NextFunction } from "express";

import {
  postShiftType,
  postSwapRequest,
  getMyShifts,
  getSingleShift,
  getSingleShiftType,
  putShiftType,
  delShiftType,
  generateShift,
  patchSwapRequest,
} from "./shift.service";
import { AppError } from "../../middlewares/error.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

const createShiftType = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, startTime, endTime, departmentId } = req.body;
    if (!name || !startTime || !endTime || !departmentId) {
      throw new AppError(
        "name , startTime , endTime and Department are all required",
        400,
      );
    }
    const data = await postShiftType(name, startTime, endTime, departmentId);
    res.status(201).json({
      status: "success",
      data,
      message: "Shift type created successfuly",
    });
  } catch (err) {
    next(err);
  }
};
const getShiftTypeByDepId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departmentId = req.params.departmentId as string;
    const data = await getSingleShiftType(departmentId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const updateShiftType = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { name, startTime, endTime } = req.body;
    const data = await putShiftType(id, name, startTime, endTime);
    res.status(200).json({
      status: "success",
      data,
      message: "Shift type updated successfuly",
    });
  } catch (err) {
    next(err);
  }
};
const deleteShiftType = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    await delShiftType(id);
    res
      .status(200)
      .json({ status: "success", message: "Shift type deleted successfuly" });
  } catch (err) {
    next(err);
  }
};
const createShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, month, year, mode, assignments } = req.body;

    if (!departmentId || !month || !year) {
      throw new AppError("Department , month , and year is required", 400);
    }
    const data = await generateShift(
      departmentId,
      month,
      year,
      mode,
      assignments,
    );
    res.status(201).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const getShiftByDepId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departmentId = req.params.departmentId as string;
    const data = await getSingleShift(departmentId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const getMyShift = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const userId = req.user.id;
    const data = await getMyShifts(userId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const shiftSwapRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const requesterId = req.user.id;
    const { targetShiftId, originalShiftId, targetStaffId } = req.body;
    const data = await postSwapRequest(
      requesterId,
      targetStaffId,
      originalShiftId,
      targetShiftId,
    );

    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

const updateShiftRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const data = await patchSwapRequest(id, status);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export {
  shiftSwapRequest,
  getShiftTypeByDepId,
  getShiftByDepId,
  getMyShift,
  createShift,
  createShiftType,
  updateShiftRequest,
  updateShiftType,
  deleteShiftType,
};
