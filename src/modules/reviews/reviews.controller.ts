import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import { postReview, getReview, updateReviewStatus } from "./reviews.service";

export const submitReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, rating, comment } = req.body;
    if (!name || !rating || !comment) {
      throw new AppError("Name, rating and comment are required", 400);
    }
    const data = await postReview(name, email, rating, comment);
    res.status(201).json({
      status: "success",
      message:
        "Review submitted successfully. It will appear after moderation.",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const viewReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getReview();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const data = await updateReviewStatus(id, status);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
