import express from "express";
import {
  applyLeave,
  myLeave,
  departmentLeave,
  leaveReview,
} from "./leave.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /leave:
 *   post:
 *     summary: Apply for leave
 *     tags: [Leave]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leaveType, startDate, endDate, reason]
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum: [ANNUAL, SICK, EMERGENCY, MATERNITY, PATERNITY]
 *               startDate:
 *                 type: string
 *                 example: "2026-07-10"
 *               endDate:
 *                 type: string
 *                 example: "2026-07-15"
 *               reason:
 *                 type: string
 *                 example: Family vacation
 *     responses:
 *       200:
 *         description: Leave application submitted
 *       400:
 *         description: Insufficient balance or overlapping dates
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.STAFF, Role.DEPT_HEAD),
  applyLeave,
);

/**
 * @swagger
 * /leave/my-leave:
 *   get:
 *     summary: Get my leave applications
 *     tags: [Leave]
 *     responses:
 *       200:
 *         description: List of leave applications
 */
router.get("/my-leave", authMiddleware, myLeave);

/**
 * @swagger
 * /leave/department:
 *   get:
 *     summary: Get all leave applications for a department
 *     tags: [Leave]
 *     responses:
 *       200:
 *         description: Department leave applications
 */
router.get(
  "/department",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  departmentLeave,
);

/**
 * @swagger
 * /leave/{id}/review:
 *   patch:
 *     summary: Approve or reject a leave application
 *     tags: [Leave]
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
 *               reviewNote:
 *                 type: string
 *                 example: Approved. Enjoy your leave.
 *     responses:
 *       200:
 *         description: Leave application reviewed
 */
router.patch(
  "/:id/review",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  leaveReview,
);

export { router };
