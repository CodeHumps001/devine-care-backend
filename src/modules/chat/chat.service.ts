// modules/chat/chat.service.ts
import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { sendPushNotification } from "../../utils/pushNotifications";

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

// modules/chat/chat.service.ts — replace createGroupConversation
const createGroupConversation = async (departmentId: string) => {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { users: true },
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  const currentMemberIds = department.users.map((u) => u.id);

  let conversation = await prisma.conversation.findFirst({
    where: { type: "GROUP", departmentId },
    include: { members: true },
  });

  if (!conversation) {
    // first time — create it with today's department members
    conversation = await prisma.$transaction(async (tx) => {
      const newConversation = await tx.conversation.create({
        data: { type: "GROUP", departmentId },
      });
      await tx.conversationMember.createMany({
        data: currentMemberIds.map((userId) => ({
          conversationId: newConversation.id,
          userId,
        })),
      });
      return tx.conversation.findUniqueOrThrow({
        where: { id: newConversation.id },
        include: { members: true },
      });
    });
    return conversation;
  }

  // ── Reconcile membership: add anyone new, remove anyone who left ──
  const existingMemberIds = conversation.members.map((m) => m.userId);

  const toAdd = currentMemberIds.filter(
    (id) => !existingMemberIds.includes(id),
  );
  const toRemove = existingMemberIds.filter(
    (id) => !currentMemberIds.includes(id),
  );

  if (toAdd.length > 0 || toRemove.length > 0) {
    await prisma.$transaction([
      ...(toAdd.length > 0
        ? [
            prisma.conversationMember.createMany({
              data: toAdd.map((userId) => ({
                conversationId: conversation!.id,
                userId,
              })),
            }),
          ]
        : []),
      ...(toRemove.length > 0
        ? [
            prisma.conversationMember.deleteMany({
              where: {
                conversationId: conversation!.id,
                userId: { in: toRemove },
              },
            }),
          ]
        : []),
    ]);
  }

  return conversation;
};

// modules/chat/chat.service.ts — update getMyConversations
const getMyConversations = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      department: { select: { name: true } },
      members: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              position: true,
              isActive: true,
              profile: { select: { photoUrl: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
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

  // ── Notify other conversation members who aren't the sender ──
  // (fires for both DIRECT and GROUP conversations — group chats will
  // push to every other member, which is the expected behavior)
  const otherMembers = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { not: senderId } },
    include: { user: { select: { expoPushToken: true } } },
  });

  const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
  const notificationBody =
    content.length > 100 ? `${content.slice(0, 97)}...` : content;

  for (const m of otherMembers) {
    void sendPushNotification(
      m.user.expoPushToken,
      senderName,
      notificationBody,
      {
        type: "NEW_MESSAGE",
        conversationId,
      },
    );
  }

  return message;
};

// modules/chat/chat.service.ts — add
const syncAllGroupChats = async () => {
  const departments = await prisma.department.findMany({
    select: { id: true },
  });
  const results = [];
  for (const dept of departments) {
    try {
      await createGroupConversation(dept.id);
      results.push({ departmentId: dept.id, status: "synced" });
    } catch (err: any) {
      results.push({
        departmentId: dept.id,
        status: "failed",
        error: err.message,
      });
    }
  }
  return results;
};

export {
  createDirectConversation,
  createGroupConversation,
  getMyConversations,
  getConversationMessages,
  saveMessage,
  syncAllGroupChats,
};
