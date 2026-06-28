import { AttendanceStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { calculateDistance } from "../../utils/haversine";

const clockIn = async (userId: string, latitude: number, longitude: number) => {
  // step 1 — get hospital GPS coordinates and geofence radius from settings
  const hpSettings = await prisma.hospitalSettings.findFirst({
    select: {
      latitude: true,
      longitude: true,
      geofenceRadius: true,
    },
  });

  if (!hpSettings) {
    throw new AppError("Hospital settings not configured", 404);
  }

  // step 2 — calculate distance between staff current location and hospital
  const distance = calculateDistance(
    latitude,
    longitude,
    hpSettings.latitude,
    hpSettings.longitude,
  );

  // step 3 — if staff is outside the geofence radius, block clock-in
  if (distance > hpSettings.geofenceRadius) {
    throw new AppError("You are not within hospital premises", 401);
  }

  // step 4 — get today's date range (midnight to midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // step 5 — find the shift scheduled for this user today
  const shift = await prisma.shift.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      shiftType: true,
    },
  });

  if (!shift) {
    throw new AppError("No shift scheduled for today", 404);
  }

  // step 6 — check if staff already clocked in for this shift
  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: { shiftId: shift.id },
  });

  if (existingRecord) {
    throw new AppError("Already clocked in", 400);
  }

  // step 7 — compare current time to shift start time to determine status
  const now = new Date();
  const [shiftHour, shiftMinute] = shift.shiftType.startTime
    .split(":")
    .map(Number);

  const shiftStart = new Date();
  shiftStart.setHours(shiftHour, shiftMinute, 0, 0);

  // if current time is after shift start → LATE, otherwise → PRESENT
  const status = now <= shiftStart ? "PRESENT" : "LATE";

  // step 8 — create the attendance record with location and status
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

  return attendance;
};

const clockOut = async (userId: string) => {
  // step 1 — get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // step 2 — find today's shift for this user
  const shift = await prisma.shift.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (!shift) {
    throw new AppError("No shift found for today", 404);
  }

  // step 3 — find the attendance record for this shift
  const attendanceRecord = await prisma.attendanceRecord.findUnique({
    where: { shiftId: shift.id },
  });

  // step 4 — if no record exists, staff never clocked in
  if (!attendanceRecord) {
    throw new AppError("You have not clocked in yet", 400);
  }

  // step 5 — if already clocked out, block duplicate clock-out
  if (attendanceRecord.clockOut) {
    throw new AppError("Already clocked out", 400);
  }

  // step 6 — update the record with clock-out time
  const updated = await prisma.attendanceRecord.update({
    where: { id: attendanceRecord.id },
    data: {
      clockOut: new Date(),
    },
  });

  return updated;
};

const getMyAttendance = async (userId: string) => {
  const records = await prisma.attendanceRecord.findMany({
    where: { userId },
    include: {
      shift: {
        include: {
          shiftType: true,
        },
      },
    },
  });

  return records;
};
const getDepartmentAttendance = async (departmentId: string) => {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      shift: {
        departmentId,
      },
    },
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
      shift: {
        include: {
          shiftType: true,
        },
      },
    },
  });

  return records;
};
const updateAttendance = async (id: string, status: AttendanceStatus) => {
  // step 1 — check if attendance record exists
  const record = await prisma.attendanceRecord.findUnique({ where: { id } });

  if (!record) {
    throw new AppError("Attendance record not found", 404);
  }

  // step 2 — manually override the status
  const updated = await prisma.attendanceRecord.update({
    where: { id },
    data: { status },
  });

  return updated;
};

export {
  clockIn,
  clockOut,
  getMyAttendance,
  getDepartmentAttendance,
  updateAttendance,
};
