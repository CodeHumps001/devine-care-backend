import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  createDirectConversation,
  getMyConversations,
  getConversationMessages,
} from "./chat.service";
import { AppError } from "../../middlewares/error.middleware";

const directConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    const userId = req.user.id;
    const { targetUserId } = req.body;
    const data = await createDirectConversation(userId, targetUserId);
    res.status(201).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

const myConversations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    const userId = req.user.id;
    const data = await getMyConversations(userId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

const conversationMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    const conversationId = req.params.id as string;
    const userId = req.user.id;
    const data = await getConversationMessages(conversationId, userId);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export { directConversation, conversationMessages, myConversations };
