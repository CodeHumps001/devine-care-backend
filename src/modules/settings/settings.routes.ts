import express from "express";
import { viewSettings, updateSettings } from "./settings.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get hospital settings (geofence, contact info, branding)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Hospital settings
 *       404:
 *         description: Settings not configured yet
 */
router.get("/", authMiddleware, viewSettings);

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Create or update hospital settings
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, latitude, longitude]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Divine Netcare Hospital
 *               latitude:
 *                 type: number
 *                 example: 5.6037
 *               longitude:
 *                 type: number
 *                 example: -0.1870
 *               geofenceRadius:
 *                 type: integer
 *                 example: 100
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings saved
 */
router.put(
  "/",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateSettings,
);

export { router };
