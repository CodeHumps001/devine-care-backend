// modules/feedback/feedback.service.ts
import prisma from "../../config/prisma";

const createFeedback = async (
  userId: string,
  message: string,
  category: string,
) => {
  // Requires a Feedback model in your Prisma schema:
  //

  // }
  const feedback = await prisma.feedback.create({
    data: { userId, category, message },
  });
  return feedback;
};

export { createFeedback };
