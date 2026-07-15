// modules/feedback/feedback.routes.ts — full file
import express from "express";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { postFeedback, viewAllFeedback } from "./feedback.controller";

const router = express.Router();

router.post("/", authMiddleware, postFeedback);
router.get(
  "/",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  viewAllFeedback,
);

export { router };
