import express from "express";
import {
  directConversation,
  conversationMessages,
  myConversations,
} from "./chat.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

router.post("/conversations", authMiddleware, directConversation);
router.get("/conversations", authMiddleware, myConversations);
router.get("/conversations/:id/messages", authMiddleware, conversationMessages);

export { router };
