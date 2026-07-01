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

router.post("/", createAppointment);
router.get(
  "/",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  viewAppointments,
);
router.get(
  "/doctor",
  authMiddleware,
  authorizeRoles(Role.STAFF, Role.DEPT_HEAD),
  doctorAppointments,
);

router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles(Role.STAFF, Role.DEPT_HEAD),
  updateAppStatus,
);

export { router };
