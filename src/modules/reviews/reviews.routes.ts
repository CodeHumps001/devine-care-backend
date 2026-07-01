import express from "express";
import { submitReview, viewReview, updateReview } from "./reviews.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Submit a patient review (public, no login required)
 *     tags: [Reviews]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, rating, comment]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ama Asante
 *               email:
 *                 type: string
 *                 example: ama@gmail.com
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Excellent service and very professional staff.
 *     responses:
 *       201:
 *         description: Review submitted and pending moderation
 */
router.post("/", submitReview);

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get all approved reviews (public)
 *     tags: [Reviews]
 *     security: []
 *     responses:
 *       200:
 *         description: List of approved reviews
 */
router.get("/", viewReview);

/**
 * @swagger
 * /reviews/{id}:
 *   patch:
 *     summary: Approve or reject a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Review status updated
 */
router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateReview,
);

export { router };
