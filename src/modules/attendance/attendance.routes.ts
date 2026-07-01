import express from "express";
import {
  attendIn,
  attendOut,
  myAttendance,
  viewAttendanceByDepId,
  manualOveride,
} from "./attendance.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /attendance/clock-in:
 *   post:
 *     summary: Clock in for shift with geofence verification
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 5.6037
 *               longitude:
 *                 type: number
 *                 example: -0.1870
 *     responses:
 *       200:
 *         description: Clocked in successfully
 *       400:
 *         description: Already clocked in or no shift today
 *       401:
 *         description: Not within hospital premises
 */
router.post(
  "/clock-in",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.STAFF),
  attendIn,
);

/**
 * @swagger
 * /attendance/clock-out:
 *   post:
 *     summary: Clock out from shift
 *     tags: [Attendance]
 *     responses:
 *       200:
 *         description: Clocked out successfully
 *       400:
 *         description: Not clocked in or already clocked out
 */
router.post(
  "/clock-out",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.STAFF),
  attendOut,
);

/**
 * @swagger
 * /attendance/my-attendance:
 *   get:
 *     summary: Get my attendance records
 *     tags: [Attendance]
 *     responses:
 *       200:
 *         description: List of attendance records
 */
router.get("/my-attendance", authMiddleware, myAttendance);

/**
 * @swagger
 * /attendance/department/{departmentId}:
 *   get:
 *     summary: Get attendance records for a department
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department attendance records
 */
router.get(
  "/department/:departmentId",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  viewAttendanceByDepId,
);

/**
 * @swagger
 * /attendance/{id}/manual:
 *   patch:
 *     summary: Manually override attendance status
 *     tags: [Attendance]
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
 *                 enum: [PRESENT, LATE, ABSENT]
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 */
router.patch(
  "/:id/manual",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  manualOveride,
);

export { router };
