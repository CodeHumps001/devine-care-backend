import express from "express";
import { login, register } from "./auth.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Admin-only — create a new staff account (emails login credentials to the staff member)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, role, position]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Yaw
 *               lastName:
 *                 type: string
 *                 example: Fosu
 *               email:
 *                 type: string
 *                 example: yaw@lifecare.com
 *               password:
 *                 type: string
 *                 description: Temporary password — emailed to the new staff member
 *                 example: TempPass123
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, DEPT_HEAD, STAFF]
 *                 example: STAFF
 *               position:
 *                 type: string
 *                 enum: [DOCTOR, NURSE, MIDWIFE, PHARMACIST, LAB_TECHNICIAN, RECEPTIONIST, ADMINISTRATOR, OTHER]
 *                 example: NURSE
 *               departmentId:
 *                 type: string
 *                 example: 75cbba2c-4595-44ed-a80e-bac8f4e3b7d3
 *     responses:
 *       201:
 *         description: Account created and welcome email sent
 *       400:
 *         description: User already exists or validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized — SUPER_ADMIN only
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and get JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: yaw@lifecare.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token and user info
 *       400:
 *         description: Invalid email or password
 *       401:
 *         description: Account deactivated
 */
router.post("/login", login);

export { router };
