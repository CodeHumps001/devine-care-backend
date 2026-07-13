import express from "express";
import {
  getUser,
  getUsers,
  getUserProfile,
  deleteUser,
  deactivate,
  getMyProfile,
} from "./users.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all active staff members
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all active staff
 */
router.get("/", getUsers);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update own staff profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0244123456"
 *               photoUrl:
 *                 type: string
 *                 example: "https://cloudinary.com/photo.jpg"
 *               bio:
 *                 type: string
 *                 example: Senior nurse with 5 years experience
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put("/profile", authMiddleware, getUserProfile);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a staff account
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  deactivate,
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single staff member
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff member details
 *       404:
 *         description: User not found
 */
router.get("/:id", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), getUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a staff member
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  deleteUser,
);
// users.routes.ts — add a self-serve GET
router.get("/profile", authMiddleware, getMyProfile);
export { router };
