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

router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  postAnnouncement,
);
router.get("/", authMiddleware, viewAnnouncement);
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  modifyAnnouncement,
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.DEPT_HEAD, Role.SUPER_ADMIN),
  delAnnouncement,
);
router.get("/:id", authMiddleware, viewAnnouncementById);

export { router };
