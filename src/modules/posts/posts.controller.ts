import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  publishPost,
  updatePost,
} from "./post.service";

const makePost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }

    const authorId = req.user.id;
    const { content, coverImage, title } = req.body;
    if (!content || !title) {
      throw new AppError("Title and content are required", 400);
    }
    const data = await createPost(title, content, authorId, coverImage);
    res.status(201).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const viewPosts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getPosts();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const modifyPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    const id = req.params.id as string;
    const authorId = req.user.id;
    const { content, title } = req.body;
    const data = await updatePost(id, authorId, title, content);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
const delPost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    const id = req.params.id as string;
    const authorId = req.user.id;
    await deletePost(id, authorId);
    res
      .status(200)
      .json({ status: "success", message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
};
const viewPostById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const data = await getPost(id);
    res.status(200).json({ status: "success", data }); // 200 not 201
  } catch (err) {
    next(err);
  }
};
const publish = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }

    const id = req.params.id as string;
    const authorId = req.user.id;
    const data = await publishPost(id, authorId);
    res.status(201).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export { viewPosts, viewPostById, makePost, delPost, modifyPost, publish };
