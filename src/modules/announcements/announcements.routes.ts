import express from "express";
import {
  viewAnnouncement,
  viewAnnouncementById,
  postAnnouncement,
  delAnnouncement,
  modifyAnnouncement,
} from "./announcements.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create an announcement
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: New Shift Schedule Published
 *               content:
 *                 type: string
 *                 example: July shift schedules are now live.
 *               departmentId:
 *                 type: string
 *                 description: Optional. If omitted, announcement is hospital-wide.
 *     responses:
 *       201:
 *         description: Announcement created successfully
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  postAnnouncement,
);

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: List of announcements with author info
 */
router.get("/", authMiddleware, viewAnnouncement);

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Get a single announcement
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement details
 *       404:
 *         description: Announcement not found
 */
router.get("/:id", authMiddleware, viewAnnouncementById);

/**
 * @swagger
 * /announcements/{id}:
 *   put:
 *     summary: Update an announcement
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement updated
 */
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  modifyAnnouncement,
);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement deleted
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  delAnnouncement,
);

export { router };
