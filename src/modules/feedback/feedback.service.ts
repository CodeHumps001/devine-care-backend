// modules/feedback/feedback.service.ts — full file
import prisma from "../../config/prisma";
import { sendBatchedPushNotifications } from "../../utils/pushNotifications";

const createFeedback = async (
  userId: string,
  message: string,
  category: string,
) => {
  const feedback = await prisma.feedback.create({
    data: { userId, category, message },
  });

  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { expoPushToken: true },
  });

  void sendBatchedPushNotifications(
    admins,
    "New Feedback Received",
    message.length > 100 ? `${message.slice(0, 97)}...` : message,
    { type: "FEEDBACK" },
  );

  return feedback;
};

const getAllFeedback = async () => {
  return prisma.feedback.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, position: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export { createFeedback, getAllFeedback };
