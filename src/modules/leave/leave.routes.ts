import express from "express";
import {
  applyLeave,
  myLeave,
  departmentLeave,
  leaveReview,
} from "./leave.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.STAFF, Role.DEPT_HEAD),
  applyLeave,
);
router.get("/my-leave", authMiddleware, myLeave);
router.get(
  "/department",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  departmentLeave,
);
router.patch(
  "/:id/review",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN, Role.DEPT_HEAD),
  leaveReview,
);

export { router };
