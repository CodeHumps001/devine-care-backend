import express from "express";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { submitReview, viewReview, updateReview } from "./reviews.controller";
const router = express.Router();

router.post("/", submitReview);

router.get("/", viewReview);
router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  updateReview,
);

export { router };
