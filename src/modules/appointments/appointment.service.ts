import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { AppointmentStatus, Position } from "@prisma/client";
import { queueAppointmentNotification } from "../jobs/notification.jobs";

export const postAppointment = async (
  doctorId: string,
  patientName: string,
  patientPhone: string,
  reason: string,
  date: string,
  patientEmail?: string,
) => {
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new AppError("Doctor not found", 404);
  if (doctor.position !== Position.DOCTOR) {
    throw new AppError("Selected staff is not a doctor", 400);
  }

  return await prisma.appointment.create({
    data: {
      doctorId,
      patientName,
      patientPhone,
      patientEmail,
      reason,
      date: new Date(date),
    },
  });
};

export const getAppointments = async () => {
  return await prisma.appointment.findMany({
    include: {
      doctor: {
        select: { firstName: true, lastName: true, position: true },
      },
    },
    orderBy: { date: "asc" },
  });
};

export const getDoctorAppointments = async (doctorId: string) => {
  return await prisma.appointment.findMany({
    where: { doctorId },
    orderBy: { date: "asc" },
  });
};

export const updateStatus = async (id: string, status: AppointmentStatus) => {
  // step 1 — find appointment with doctor details
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  if (!appointment) throw new AppError("Appointment not found", 404);

  // step 2 — update the status
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  // step 3 — queue SMS and email notification to patient
  await queueAppointmentNotification({
    patientName: appointment.patientName,
    patientPhone: appointment.patientPhone,
    patientEmail: appointment.patientEmail,
    doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
    status,
    date: appointment.date.toDateString(),
  });

  return updated;
};
