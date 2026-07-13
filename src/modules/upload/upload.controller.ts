// modules/upload/upload.controller.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import { uploadImageBuffer } from "./upload.service";

const uploadImage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 403);
    if (!req.file) throw new AppError("No image file provided", 400);

    const url = await uploadImageBuffer(
      req.file.buffer,
      "divine-netcare/profiles",
    );
    res.status(200).json({ status: "success", data: { url } });
  } catch (err) {
    next(err);
  }
};

export { uploadImage };
