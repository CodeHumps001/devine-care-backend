import express from "express";
import {
  shiftSwapRequest,
  getShiftByDepId,
  getMyShift,
  createShift,
  updateShiftRequest,
  myShiftSwapRequests,
  departmentShiftSwapRequests,
  colleagueShifts,
} from "./shift.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /shifts/generate:
 *   post:
 *     summary: Generate monthly shift schedule for a department
 *     tags: [Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [departmentId, month, year, mode]
 *             properties:
 *               departmentId:
 *                 type: string
 *               month:
 *                 type: integer
 *                 example: 7
 *               year:
 *                 type: integer
 *                 example: 2026
 *               mode:
 *                 type: string
 *                 enum: [auto, manual]
 *               staffGroups:
 *                 type: object
 *                 properties:
 *                   morning:
 *                     type: array
 *                     items:
 *                       type: string
 *                   night:
 *                     type: array
 *                     items:
 *                       type: string
 *                   rotating:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       201:
 *         description: Shifts generated successfully
 */
router.post(
  "/generate",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  createShift,
);

/**
 * @swagger
 * /shifts/my-shifts:
 *   get:
 *     summary: Get my shift schedule
 *     tags: [Shifts]
 *     responses:
 *       200:
 *         description: List of shifts for the logged in user
 */
router.get("/my-shifts", authMiddleware, getMyShift);

/**
 * @swagger
 * /shifts/swap-request:
 *   post:
 *     summary: Request a shift swap with another staff member
 *     tags: [Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originalShiftId, targetShiftId, targetStaffId]
 *             properties:
 *               originalShiftId:
 *                 type: string
 *               targetShiftId:
 *                 type: string
 *               targetStaffId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Swap request submitted
 */
router.post(
  "/swap-request",
  authMiddleware,
  authorizeRoles(Role.STAFF),
  shiftSwapRequest,
);

/**
 * @swagger
 * /shifts/department/{departmentId}:
 *   get:
 *     summary: Get all shifts for a department
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department shift schedule
 */
router.get(
  "/department/:departmentId",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  getShiftByDepId,
);

router.get("/swap-requests/my", authMiddleware, myShiftSwapRequests);

router.get(
  "/swap-requests/department",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  departmentShiftSwapRequests,
);

router.get(
  "/colleagues",
  authMiddleware,
  authorizeRoles(Role.STAFF, Role.DEPT_HEAD),
  colleagueShifts,
);

/**
 * @swagger
 * /shifts/swap-request/{id}:
 *   patch:
 *     summary: Approve or reject a shift swap request
 *     tags: [Shifts]
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
 *         description: Swap request updated
 */
router.patch(
  "/swap-request/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  updateShiftRequest,
);

export { router };
