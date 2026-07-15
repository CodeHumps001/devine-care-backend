// modules/feedback/feedback.controller.ts — full file
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import { createFeedback, getAllFeedback } from "./feedback.service";

const postFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    const { message, category } = req.body;
    if (!message?.trim())
      throw new AppError("Feedback message is required", 400);

    const data = await createFeedback(
      req.user.id,
      message.trim(),
      category || "GENERAL",
    );
    res.status(201).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

const viewAllFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getAllFeedback();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export { postFeedback, viewAllFeedback };
