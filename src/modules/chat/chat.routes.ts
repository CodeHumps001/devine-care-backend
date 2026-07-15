import express from "express";
import {
  directConversation,
  conversationMessages,
  myConversations,
  myGroupChat,
} from "./chat.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /chat/conversations:
 *   post:
 *     summary: Start a direct conversation with another staff member
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId]
 *             properties:
 *               targetUserId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation created or returned if exists
 */
router.post("/conversations", authMiddleware, directConversation);

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get all my conversations
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: List of conversations with last message preview
 */
router.get("/conversations", authMiddleware, myConversations);
router.get("/my-group", authMiddleware, myGroupChat);

/**
 * @swagger
 * /chat/conversations/{id}/messages:
 *   get:
 *     summary: Get all messages in a conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages with sender info
 *       403:
 *         description: Not a member of this conversation
 */
router.get("/conversations/:id/messages", authMiddleware, conversationMessages);

export { router };
