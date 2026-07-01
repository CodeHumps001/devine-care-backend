import express from "express";
import {
  createDepartments,
  viewDepartments,
  viewSingleDepartments,
  updateDepartments,
  deleteDepartments,
} from "./departments.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Records
 *               minStaffPerShift:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Department created successfully
 *       400:
 *         description: Department already exists
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  createDepartments,
);

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: List of all departments with staff count
 */
router.get("/", authMiddleware, viewDepartments);

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get a single department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department details with shift types and users
 *       404:
 *         description: Department not found
 */
router.get("/:id", authMiddleware, viewSingleDepartments);

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Update a department
 *     tags: [Departments]
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
 *                 example: Medical Records
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 */
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateDepartments,
);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  deleteDepartments,
);

export { router };
