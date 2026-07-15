import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { markMessagesAsRead, saveMessage } from "./chat.service";

interface SocketUser {
  id: string;
  role: string;
  departmentId: string | null;
}

export const initializeChatGateway = (io: Server) => {
  // middleware — verify JWT on every socket connection
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as SocketUser;

      // attach user to socket so we know who this connection belongs to
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`User connected: ${user.id}`);

    // event: join a conversation room
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${user.id} joined conversation ${conversationId}`);
    });

    // event: leave a conversation room
    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`User ${user.id} left conversation ${conversationId}`);
    });

    socket.on("mark_read", async (conversationId: string) => {
      try {
        await markMessagesAsRead(conversationId, user.id);
        io.to(conversationId).emit("messages_read", {
          conversationId,
          userId: user.id,
          readAt: new Date().toISOString(),
        });
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    });

    // event: send a message
    socket.on(
      "send_message",
      async (data: { conversationId: string; content: string }) => {
        try {
          // save message to database
          const message = await saveMessage(
            data.conversationId,
            user.id,
            data.content,
          );

          // broadcast message to everyone in the conversation room
          io.to(data.conversationId).emit("new_message", message);
        } catch (err: any) {
          // send error back to the sender only
          socket.emit("error", { message: err.message });
        }
      },
    );

    // event: typing indicator
    socket.on("typing", (conversationId: string) => {
      // broadcast to everyone in the room except the sender
      socket.to(conversationId).emit("user_typing", {
        userId: user.id,
      });
    });

    // event: disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.id}`);
    });
  });
};
