import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { ReviewStatus } from "@prisma/client";

export const postReview = async (
  name: string,
  email: string,
  rating: number,
  comment: string,
) => {
  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  return await prisma.review.create({
    data: { name, email, rating, comment },
  });
};

// public: only approved reviews (used on the website)
export const getReview = async () => {
  return await prisma.review.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
};

// admin-only: every review regardless of status, so PENDING ones are
// actually visible for moderation
export const getAllReviews = async () => {
  return await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const updateReviewStatus = async (id: string, status: ReviewStatus) => {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new AppError("Review not found", 404);

  return await prisma.review.update({
    where: { id },
    data: { status },
  });
};
