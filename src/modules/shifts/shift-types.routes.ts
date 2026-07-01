import express from "express";
import {
  createShiftType,
  getShiftTypeByDepId,
  updateShiftType,
  deleteShiftType,
} from "./shift.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /shift-types:
 *   post:
 *     summary: Create a shift type for a department
 *     tags: [Shift Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startTime, endTime, departmentId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Night
 *               startTime:
 *                 type: string
 *                 example: "22:00"
 *               endTime:
 *                 type: string
 *                 example: "06:00"
 *               departmentId:
 *                 type: string
 *                 example: 75cbba2c-4595-44ed-a80e-bac8f4e3b7d3
 *               isDayOff:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Shift type created successfully
 *       400:
 *         description: Shift type already exists in this department
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  createShiftType,
);

/**
 * @swagger
 * /shift-types/{departmentId}:
 *   get:
 *     summary: Get all shift types for a department
 *     tags: [Shift Types]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of shift types
 *       404:
 *         description: Department not found
 */
router.get("/:departmentId", authMiddleware, getShiftTypeByDepId);

/**
 * @swagger
 * /shift-types/{id}:
 *   put:
 *     summary: Update a shift type
 *     tags: [Shift Types]
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
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shift type updated successfully
 */
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateShiftType,
);

/**
 * @swagger
 * /shift-types/{id}:
 *   delete:
 *     summary: Delete a shift type
 *     tags: [Shift Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shift type deleted successfully
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  deleteShiftType,
);

export { router };
