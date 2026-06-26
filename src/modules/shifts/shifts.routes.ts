import express from "express";
import {
  shiftSwapRequest,
  getShiftByDepId,
  getMyShift,
  createShift,
  updateShiftRequest,
} from "./shift.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";
const router = express.Router();

//shift rotes

router.post(
  "/generate",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  createShift,
);
router.post(
  "/swap-request",
  authMiddleware,
  authorizeRoles(Role.STAFF),
  shiftSwapRequest,
);
router.get("/my-shifts", authMiddleware, getMyShift);
router.get(
  "/department/:departmentId",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  getShiftByDepId,
);

router.patch(
  "/swap-request/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  updateShiftRequest,
);

export { router };
