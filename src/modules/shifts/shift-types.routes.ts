import express from "express";
import {
  getShiftTypeByDepId,
  createShiftType,
  updateShiftType,
  deleteShiftType,
} from "./shift.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";
const router = express.Router();

//shift type routes
router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  createShiftType,
);
router.get("/:departmentId", authMiddleware, getShiftTypeByDepId);
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateShiftType,
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  deleteShiftType,
);

export { router };
