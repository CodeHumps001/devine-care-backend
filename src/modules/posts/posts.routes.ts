import express from "express";
import {
  viewPosts,
  viewPostById,
  makePost,
  delPost,
  modifyPost,
  publish,
} from "./posts.controller";
import {
  authMiddleware,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { Role } from "@prisma/client";
const router = express.Router();

router.post("/", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), makePost);
router.get("/", viewPosts);
router.get("/:id", viewPostById);
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  modifyPost,
);
router.delete("/", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), delPost);
router.patch(
  "/:id/publish",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  publish,
);

export { router };
