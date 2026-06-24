import express from "express";
import {
  createDepartments,
  viewDepartments,
  updateDepartments,
  deleteDepartments,
  viewSingleDepartments,
} from "./departments.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";
const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  createDepartments,
);
router.get("/", authMiddleware, viewDepartments);
router.get("/:id", authMiddleware, viewSingleDepartments);
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateDepartments,
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  deleteDepartments,
);

export { router };
