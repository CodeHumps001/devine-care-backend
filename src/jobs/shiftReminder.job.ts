// modules/jobs/shiftReminder.job.ts
import cron from "node-cron";
import prisma from "../config/prisma";
import { sendBatchedPushNotifications } from "../utils/pushNotifications";

export const startShiftReminderJob = () => {
  // Runs every day at 6:00 AM server time
  cron.schedule("0 6 * * *", async () => {
    console.log("Running daily shift reminder job...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysShifts = await prisma.shift.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        user: { select: { expoPushToken: true, firstName: true } },
        shiftType: true,
      },
    });

    if (todaysShifts.length === 0) {
      console.log("No shifts today, skipping reminder job.");
      return;
    }

    // group by shift type/time so the message is meaningful per recipient,
    // but since content differs per person we send individually rather than
    // one giant batch — still using the batched sender's chunking/delay
    const recipients = todaysShifts.map((s) => ({
      expoPushToken: s.user.expoPushToken,
    }));

    // Note: this sends the same generic message to everyone with a shift
    // today. If you want per-shift-time messages, this needs to loop and
    // call sendPushNotification individually instead — flagging that
    // trade-off rather than assuming.
    await sendBatchedPushNotifications(
      recipients,
      "Shift Today",
      "You have a shift scheduled today. Check the app for your time and details.",
      { type: "SHIFT_REMINDER" },
    );

    console.log(`Shift reminders sent to ${todaysShifts.length} staff.`);
  });

  console.log("Shift reminder cron job scheduled (daily at 6:00 AM).");
};
