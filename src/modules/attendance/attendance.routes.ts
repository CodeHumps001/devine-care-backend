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

router.post(
  "/clock-in",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.STAFF),
  attendIn,
);

router.post(
  "/clock-out",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.STAFF),
  attendOut,
);
router.get("/my-attendance", authMiddleware, myAttendance);
router.get(
  "/department/:departmentId",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  viewAttendanceByDepId,
);
router.patch(
  "/:id/manual",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  manualOveride,
);

export { router };
