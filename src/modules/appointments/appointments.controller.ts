import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import {
  postAppointment,
  getAppointments,
  getDoctorAppointments,
  updateStatus,
} from "./appointment.service";

export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { doctorId, patientName, patientPhone, patientEmail, reason, date } =
      req.body;
    if (!doctorId || !patientName || !patientPhone || !reason || !date) {
      throw new AppError("All required fields must be provided", 400);
    }
    const data = await postAppointment(
      doctorId,
      patientName,
      patientPhone,
      reason,
      date,
      patientEmail,
    );
    res.status(201).json({
      status: "success",
      message: "Appointment booked successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const viewAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getAppointments();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const doctorAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    const doctorId = req.user.id;
    const data = await getDoctorAppointments(doctorId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const updateAppStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const data = await updateStatus(id, status);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
