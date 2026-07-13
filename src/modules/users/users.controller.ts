import { Response, Request, NextFunction } from "express";
import {
  user,
  users,
  userDelete,
  deactivateUser,
  updateProfile,
} from "./users.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";

const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await user(id);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await users();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const userId = req.user.id as string;
    const { phone, photoUrl, bio } = req.body;
    const data = await updateProfile(userId, { phone, photoUrl, bio });
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const deactivate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await deactivateUser(id);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await userDelete(id);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

// users.controller.ts
const getMyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    const data = await user(req.user.id); // reuse existing user() service fn
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
export {
  getUser,
  getUsers,
  getUserProfile,
  deleteUser,
  deactivate,
  getMyProfile,
};
