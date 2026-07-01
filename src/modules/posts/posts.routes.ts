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

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a blog post (saved as draft)
 *     tags: [Blog Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Divine Netcare Launches New Maternity Wing
 *               content:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 example: https://cloudinary.com/image.jpg
 *     responses:
 *       201:
 *         description: Post created as draft
 */
router.post("/", authMiddleware, authorizeRoles(Role.SUPER_ADMIN), makePost);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all published blog posts (public)
 *     tags: [Blog Posts]
 *     security: []
 *     responses:
 *       200:
 *         description: List of published posts
 */
router.get("/", viewPosts);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a single blog post (public)
 *     tags: [Blog Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
router.get("/:id", viewPostById);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a blog post
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post updated
 *       403:
 *         description: Not authorized to edit this post
 */
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  modifyPost,
);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  delPost,
);

/**
 * @swagger
 * /posts/{id}/publish:
 *   patch:
 *     summary: Toggle publish status of a post
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post publish status toggled
 */
router.patch(
  "/:id/publish",
  authMiddleware,
  authorizeRoles(Role.SUPER_ADMIN),
  publish,
);

export { router };
