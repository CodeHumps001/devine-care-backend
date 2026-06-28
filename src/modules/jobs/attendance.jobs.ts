// ─── PROCESSOR ───────────────────────────────────────────

import prisma from "../../config/prisma";
import { attendanceQueue } from "../../config/queue";

// this function runs every time a job is picked from the queue
attendanceQueue.process(async (job) => {
  const { shiftId, userId } = job.data;

  // check if staff already clocked in
  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: { shiftId },
  });

  // if no record exists, staff never clocked in — mark as ABSENT
  if (!existingRecord) {
    await prisma.attendanceRecord.create({
      data: {
        userId,
        shiftId,
        status: "ABSENT",
      },
    });
  }
});

// ─── SCHEDULER ───────────────────────────────────────────
// call this function at server startup to schedule daily absence checks
export const scheduleAttendanceJobs = async () => {
  // get all shifts for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayShifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
      shiftType: {
        isDayOff: false,
      },
    },
    include: {
      shiftType: true,
    },
  });

  // for each shift, schedule a job to run at shift start time
  for (const shift of todayShifts) {
    const [hour, minute] = shift.shiftType.startTime.split(":").map(Number);

    const shiftStart = new Date();
    shiftStart.setHours(hour, minute, 0, 0);

    // add a 15 minute grace period before marking absent
    const delay = shiftStart.getTime() + 15 * 60 * 1000 - Date.now();

    // only schedule if shift start is in the future
    if (delay > 0) {
      await attendanceQueue.add(
        { shiftId: shift.id, userId: shift.userId },
        { delay },
      );
    }
  }

  console.log(`Scheduled ${todayShifts.length} attendance jobs for today`);
};
