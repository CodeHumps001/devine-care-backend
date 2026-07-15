import cron from "node-cron";
import prisma from "../config/prisma";

// ─── HELPER ──────────────────────────────────────────────
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getTomorrow = () => {
  const tomorrow = getToday();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

// ─── JOB 1: Mark absent staff ────────────────────────────
// Runs every 30 minutes — checks if any shift started more
// than 15 minutes ago with no clock-in and marks ABSENT
const runAbsenceCheck = async () => {
  try {
    const now = new Date();
    const today = getToday();
    const tomorrow = getTomorrow();

    const todayShifts = await prisma.shift.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        shiftType: { isDayOff: false },
      },
      include: { shiftType: true },
    });

    for (const shift of todayShifts) {
      const [hour, minute] = shift.shiftType.startTime.split(":").map(Number);

      const shiftStart = new Date();
      shiftStart.setHours(hour, minute, 0, 0);

      // 15 min grace period has passed
      const graceEnd = new Date(shiftStart.getTime() + 15 * 60 * 1000);

      if (now >= graceEnd) {
        const existingRecord = await prisma.attendanceRecord.findUnique({
          where: { shiftId: shift.id },
        });

        if (!existingRecord) {
          await prisma.attendanceRecord.create({
            data: {
              userId: shift.userId,
              shiftId: shift.id,
              status: "ABSENT",
            },
          });
          console.log(`Marked absent: shift ${shift.id}`);
        }
      }
    }
  } catch (err) {
    console.error("Absence check error:", err);
  }
};

// ─── JOB 2: Daily shift reminder SMS ─────────────────────
// Runs every day at 06:00 AM
// Sends SMS to each staff member about their shift for the day
const runShiftReminders = async () => {
  try {
    const today = getToday();
    const tomorrow = getTomorrow();

    const todayShifts = await prisma.shift.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        shiftType: { isDayOff: false },
      },
      include: {
        user: true,
        shiftType: true,
      },
    });

    for (const shift of todayShifts) {
      // if (!shift.user.phone) continue;

      const message =
        `Hello ${shift.user.firstName}, you have a ` +
        `${shift.shiftType.name} shift today at Divine Netcare Hospital ` +
        `starting at ${shift.shiftType.startTime}. ` +
        `Please clock in on time.`;

      try {
        // await sendSMS(shift.user.phone, message);
        console.log(`Reminder sent to ${shift.user.firstName}`);
      } catch (smsErr) {
        console.error(`SMS failed for ${shift.user.firstName}:`, smsErr);
      }
    }

    console.log(`Shift reminders sent for ${todayShifts.length} shifts`);
  } catch (err) {
    console.error("Shift reminder error:", err);
  }
};

// ─── JOB 3: Announcement SMS ─────────────────────────────
// Call this directly when an announcement is created
// to notify all relevant staff immediately
export const notifyAnnouncementBySMS = async (announcementId: string) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        department: {
          include: { users: true },
        },
      },
    });

    if (!announcement) return;

    let usersToNotify: any[] = [];

    if (announcement.departmentId && announcement.department) {
      // department-specific announcement
      usersToNotify = announcement.department.users;
    } else {
      // hospital-wide — notify all active staff
      usersToNotify = await prisma.user.findMany({
        where: { isActive: true },
      });
    }

    for (const user of usersToNotify) {
      if (!user.phone) continue;
      const message =
        `Divine Netcare Notice: ${announcement.title}. ` +
        `${announcement.content}`;
      try {
        // await sendSMS(user.phone, message);
      } catch (err) {
        console.error(`Announcement SMS failed for ${user.firstName}:`, err);
      }
    }

    console.log(`Announcement SMS sent to ${usersToNotify.length} staff`);
  } catch (err) {
    console.error("Announcement notification error:", err);
  }
};

// ─── SCHEDULER ───────────────────────────────────────────
export const scheduleAttendanceJobs = async () => {
  // Absence check — runs every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running absence check...");
    await runAbsenceCheck();
  });

  // Shift reminders — runs every day at 6:00 AM
  cron.schedule("0 6 * * *", async () => {
    console.log("Sending shift reminders...");
    await runShiftReminders();
  });

  console.log("Attendance and reminder jobs scheduled (no Redis needed)");
};
