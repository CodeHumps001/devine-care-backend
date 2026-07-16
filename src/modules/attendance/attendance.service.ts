// modules/attendance/attendance.service.ts
import { AttendanceStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { calculateDistance } from "../../utils/haversine";
import { sendPushNotification } from "../../utils/pushNotifications";

const clockIn = async (userId: string, latitude: number, longitude: number) => {
  const hpSettings = await prisma.hospitalSettings.findFirst({
    select: { latitude: true, longitude: true, geofenceRadius: true },
  });

  if (!hpSettings) {
    throw new AppError("Hospital settings not configured", 404);
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    hpSettings.latitude,
    hpSettings.longitude,
  );

  if (distance > hpSettings.geofenceRadius) {
    throw new AppError("You are not within hospital premises", 401);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const shift = await prisma.shift.findFirst({
    where: { userId, date: { gte: today, lt: tomorrow } },
    include: { shiftType: true },
  });

  if (!shift) {
    throw new AppError("No shift scheduled for today", 404);
  }

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: { shiftId: shift.id },
  });

  if (existingRecord) {
    throw new AppError("Already clocked in", 400);
  }

  const now = new Date();
  const [shiftHour, shiftMinute] = shift.shiftType.startTime
    .split(":")
    .map(Number);
  const shiftStart = new Date();
  shiftStart.setHours(shiftHour, shiftMinute, 0, 0);

  const status = now <= shiftStart ? "PRESENT" : "LATE";

  const attendance = await prisma.attendanceRecord.create({
    data: {
      userId,
      shiftId: shift.id,
      clockIn: now,
      clockInLatitude: latitude,
      clockInLongitude: longitude,
      status,
    },
  });

  // ── Quiet self-confirmation ──
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, expoPushToken: true, departmentId: true },
  });

  void sendPushNotification(
    user?.expoPushToken,
    "Clocked In",
    status === "LATE"
      ? `You clocked in late for your ${shift.shiftType.name} shift.`
      : `You clocked in for your ${shift.shiftType.name} shift.`,
    { type: "ATTENDANCE_UPDATE" },
  );

  // ── Alert the department head only when the clock-in is LATE ──
  if (status === "LATE" && user?.departmentId) {
    const deptHeads = await prisma.user.findMany({
      where: { departmentId: user.departmentId, role: "DEPT_HEAD" },
      select: { expoPushToken: true },
    });
    for (const head of deptHeads) {
      void sendPushNotification(
        head.expoPushToken,
        "Staff Clocked In Late",
        `${user.firstName} clocked in late for their ${shift.shiftType.name} shift.`,
        { type: "ATTENDANCE_LATE" },
      );
    }
  }

  return attendance;
};

const clockOut = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const shift = await prisma.shift.findFirst({
    where: { userId, date: { gte: today, lt: tomorrow } },
  });

  if (!shift) {
    throw new AppError("No shift found for today", 404);
  }

  const attendanceRecord = await prisma.attendanceRecord.findUnique({
    where: { shiftId: shift.id },
  });

  if (!attendanceRecord) {
    throw new AppError("You have not clocked in yet", 400);
  }

  if (attendanceRecord.clockOut) {
    throw new AppError("Already clocked out", 400);
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: attendanceRecord.id },
    data: { clockOut: new Date() },
  });

  return updated;
};

const getMyAttendance = async (userId: string) => {
  const records = await prisma.attendanceRecord.findMany({
    where: { userId },
    include: { shift: { include: { shiftType: true } } },
  });
  return records;
};

const getDepartmentAttendance = async (
  departmentId: string,
  dateString?: string,
) => {
  let clockInFilter = {};

  if (dateString) {
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    clockInFilter = { clockIn: { gte: targetDate, lt: nextDay } };
  }

  const records = await prisma.attendanceRecord.findMany({
    where: { shift: { departmentId }, ...clockInFilter },
    include: {
      user: { select: { firstName: true, lastName: true } },
      shift: { include: { shiftType: true } },
    },
  });

  return records;
};

const updateAttendance = async (id: string, status: AttendanceStatus) => {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id },
    include: { user: { select: { expoPushToken: true, firstName: true } } },
  });

  if (!record) {
    throw new AppError("Attendance record not found", 404);
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id },
    data: { status },
  });

  void sendPushNotification(
    record.user.expoPushToken,
    "Attendance Updated",
    `Your attendance status was manually updated to ${status}`,
    { type: "ATTENDANCE_UPDATE" },
  );

  return updated;
};

export {
  clockIn,
  clockOut,
  getMyAttendance,
  getDepartmentAttendance,
  updateAttendance,
};
