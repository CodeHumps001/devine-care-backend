import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "./announcements.service";

const postAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const authorId = req.user.id as string;
    const { content, title, departmentId } = req.body;
    if (!content || !title) {
      throw new AppError("Content and Title are required", 400);
    }
    const data = await createAnnouncement(
      title,
      content,
      authorId,
      departmentId,
    );
    res.status(201).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const viewAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getAnnouncements();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const modifyAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { content, title } = req.body;
    const data = await updateAnnouncement(id, title, content);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const delAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    const data = await deleteAnnouncement(id);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const viewAnnouncementById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    const data = await getAnnouncement(id);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export {
  viewAnnouncement,
  viewAnnouncementById,
  postAnnouncement,
  delAnnouncement,
  modifyAnnouncement,
};
