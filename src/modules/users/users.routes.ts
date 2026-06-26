import express from "express";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import {
  getUser,
  getUsers,
  getUserProfile,
  deleteUser,
  deactivate,
} from "./users.controller";
const router = express.Router();

router.get("/", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), getUsers);
router.put("/profile", authMiddleware, getUserProfile);
router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  deactivate,
);
router.get("/:id", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), getUser);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  deleteUser,
);

export { router };
