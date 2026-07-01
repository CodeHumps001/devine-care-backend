import express from "express";
import { login, register } from "./auth.controller";

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new staff member
 *     tags: [Auth]
 *     security: []
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
 *                 example: password123
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
 *         description: Account created successfully
 *       400:
 *         description: User already exists or validation error
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
 */
router.post("/login", login);

export { router };
