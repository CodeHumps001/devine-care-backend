import express from "express";
import {
  viewApplication,
  createAplication,
  createJobs,
  updateApplication,
  updateJob,
  delJob,
  viewJobs,
} from "./jobs.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a job listing
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, department, type, description]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Staff Nurse
 *               department:
 *                 type: string
 *                 example: Maternity
 *               type:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job listing created
 */
router.post("/", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), createJobs);

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all open job listings (public)
 *     tags: [Jobs]
 *     security: []
 *     responses:
 *       200:
 *         description: List of open job listings
 */
router.get("/", viewJobs);

/**
 * @swagger
 * /jobs/applications:
 *   get:
 *     summary: Get all job applications
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of all applications
 */
router.get(
  "/applications",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  viewApplication,
);

/**
 * @swagger
 * /jobs/{id}/apply:
 *   post:
 *     summary: Apply for a job (public, no login required)
 *     tags: [Jobs]
 *     security: []
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
 *             required: [name, phone, cvUrl]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kwame Boateng
 *               email:
 *                 type: string
 *                 example: kwame@gmail.com
 *               phone:
 *                 type: string
 *                 example: "0244123456"
 *               cvUrl:
 *                 type: string
 *                 example: https://drive.google.com/file/example
 *               coverLetter:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Already applied or position closed
 */
router.post("/:id/apply", createAplication);

/**
 * @swagger
 * /jobs/applications/{id}:
 *   patch:
 *     summary: Update application status and notify applicant
 *     tags: [Jobs]
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
 *                 enum: [PENDING, REVIEWED, SHORTLISTED, REJECTED]
 *     responses:
 *       200:
 *         description: Status updated and applicant notified via SMS and email
 */
router.patch(
  "/applications/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateApplication,
);

/**
 * @swagger
 * /jobs/{id}:
 *   patch:
 *     summary: Update a job listing
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job listing updated
 */
router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateJob,
);

/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     summary: Delete a job listing
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job listing deleted
 */
router.delete("/:id", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), delJob);

export { router };
