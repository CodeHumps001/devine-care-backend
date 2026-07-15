import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { AppointmentStatus, Position } from "@prisma/client";
import { queueAppointmentNotification } from "../jobs/notification.jobs";
import { sendPushNotification } from "../../utils/pushNotifications";

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

  const appointment = await prisma.appointment.create({
    data: {
      doctorId,
      patientName,
      patientPhone,
      patientEmail,
      reason,
      date: new Date(date),
    },
  });

  // ── Notify the doctor a new appointment was booked ──
  void sendPushNotification(
    doctor.expoPushToken,
    "New Appointment",
    `${patientName} booked an appointment for ${new Date(date).toDateString()}`,
    { type: "NEW_APPOINTMENT", appointmentId: appointment.id },
  );

  return appointment;
};

export const getAppointments = async () => {
  return prisma.appointment.findMany({
    include: {
      doctor: { select: { firstName: true, lastName: true, position: true } },
    },
    orderBy: { date: "asc" },
  });
};

export const getDoctorAppointments = async (doctorId: string) => {
  return prisma.appointment.findMany({
    where: { doctorId },
    orderBy: { date: "asc" },
  });
};

export const updateStatus = async (id: string, status: AppointmentStatus) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { doctor: { select: { firstName: true, lastName: true } } },
  });

  if (!appointment) throw new AppError("Appointment not found", 404);

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

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
