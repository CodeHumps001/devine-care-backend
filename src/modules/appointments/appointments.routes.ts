import express from "express";
import {
  createAppointment,
  viewAppointments,
  doctorAppointments,
  updateAppStatus,
} from "./appointments.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Book an appointment (public, no login required)
 *     tags: [Appointments]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, patientName, patientPhone, reason, date]
 *             properties:
 *               doctorId:
 *                 type: string
 *               patientName:
 *                 type: string
 *                 example: Kofi Mensah
 *               patientPhone:
 *                 type: string
 *                 example: "0244123456"
 *               patientEmail:
 *                 type: string
 *                 example: kofi@gmail.com
 *               reason:
 *                 type: string
 *                 example: General checkup
 *               date:
 *                 type: string
 *                 example: "2026-07-15"
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Selected staff is not a doctor
 */
router.post("/", createAppointment);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Get all appointments (admin dashboard)
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: List of all appointments
 */
router.get(
  "/",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  viewAppointments,
);

/**
 * @swagger
 * /appointments/doctor:
 *   get:
 *     summary: Get my appointments as a doctor
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: List of appointments for the logged in doctor
 */
router.get(
  "/doctor",
  authMiddleware,
  authorizeRoles(Role.STAFF, Role.DEPT_HEAD),
  doctorAppointments,
);

/**
 * @swagger
 * /appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status
 *     tags: [Appointments]
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
 *                 enum: [CONFIRMED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated and patient notified via SMS
 */
router.patch(
  "/:id/status",
  authMiddleware,
  // FIX: SUPER_ADMIN added — previously only STAFF/DEPT_HEAD could update
  // status, meaning an admin who wasn't also a doctor could never
  // confirm/cancel appointments from the admin dashboard.
  authorizeRoles(Role.SUPER_ADMIN, Role.STAFF, Role.DEPT_HEAD),
  updateAppStatus,
);

export { router };
