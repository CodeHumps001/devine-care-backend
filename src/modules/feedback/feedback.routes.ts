// modules/feedback/feedback.routes.ts
import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { postFeedback } from "./feedback.controller";

const router = express.Router();

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit feedback or a bug report
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [GENERAL, BUG, FEATURE_REQUEST]
 *     responses:
 *       201:
 *         description: Feedback submitted
 */
router.post("/", authMiddleware, postFeedback);

export { router };
