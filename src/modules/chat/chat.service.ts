import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";

const createDirectConversation = async (
  userId: string,
  targetUserId: string,
) => {
  // step 1 — check target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AppError("Target user not found", 404);
  }

  // step 2 — check if direct conversation already exists between these two users
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    include: { members: true },
  });

  if (existing) return existing;

  // step 3 — create conversation and add both members in a transaction
  const conversation = await prisma.$transaction(async (tx) => {
    const newConversation = await tx.conversation.create({
      data: { type: "DIRECT" },
    });

    await tx.conversationMember.createMany({
      data: [
        { conversationId: newConversation.id, userId },
        { conversationId: newConversation.id, userId: targetUserId },
      ],
    });

    return newConversation;
  });

  return conversation;
};

const createGroupConversation = async (departmentId: string) => {
  // step 1 — check if group conversation already exists for this department
  const existing = await prisma.conversation.findFirst({
    where: { type: "GROUP", departmentId },
  });

  if (existing) return existing;

  // step 2 — get all users in the department
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { users: true },
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  // step 3 — create group conversation and add all department members
  const conversation = await prisma.$transaction(async (tx) => {
    const newConversation = await tx.conversation.create({
      data: { type: "GROUP", departmentId },
    });

    await tx.conversationMember.createMany({
      data: department.users.map((user) => ({
        conversationId: newConversation.id,
        userId: user.id,
      })),
    });

    return newConversation;
  });

  return conversation;
};

const getMyConversations = async (userId: string) => {
  // get all conversations this user is part of
  const conversations = await prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: {
            select: { firstName: true, lastName: true, position: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // last message preview
      },
    },
  });

  return conversations;
};

const getConversationMessages = async (
  conversationId: string,
  userId: string,
) => {
  // step 1 — verify user is a member of this conversation
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!member) {
    throw new AppError("You are not a member of this conversation", 403);
  }

  // step 2 — get all messages with sender info
  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: { firstName: true, lastName: true, position: true },
      },
      readReceipts: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return messages;
};

const saveMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
) => {
  // verify sender is a member of this conversation
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: senderId },
    },
  });

  if (!member) {
    throw new AppError("You are not a member of this conversation", 403);
  }

  // save message to database
  const message = await prisma.message.create({
    data: { conversationId, senderId, content },
    include: {
      sender: {
        select: { firstName: true, lastName: true, position: true },
      },
    },
  });

  return message;
};

export {
  createDirectConversation,
  createGroupConversation,
  getMyConversations,
  getConversationMessages,
  saveMessage,
};
