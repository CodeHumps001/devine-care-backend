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

router.post("/", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), createJobs);
router.get("/", viewJobs);
router.get(
  "/applications",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  viewApplication,
);
router.post("/:id/apply", createAplication);
router.patch(
  "/applications/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateApplication,
);
router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateJob,
);
router.delete("/:id", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), delJob);

export { router };
