// modules/upload/upload.routes.ts
import express from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadImage } from "./upload.controller";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload an image (profile photo) to Cloudinary
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded, returns the Cloudinary URL
 */
router.post("/image", authMiddleware, upload.single("image"), uploadImage);

export { router };
