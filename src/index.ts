import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import { router as authRouter } from "./modules/auth/auth.routes";
import { router as departmentRouter } from "./modules/departments/departments.routes";
import { router as userRoutes } from "./modules/users/users.routes";
import { router as shiftTypeRoutes } from "./modules/shifts/shift-types.routes";
import { router as shiftRoutes } from "./modules/shifts/shifts.routes";
import { router as attendanceRoutes } from "./modules/attendance/attendance.routes";
import { router as leaveRoutes } from "./modules/leave/leave.routes";
import { router as chatRoutes } from "./modules/chat/chat.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { scheduleAttendanceJobs } from "./jobs/attendance.jobs";
import { initializeChatGateway } from "./modules/chat/chat.gateway";

dotenv.config();

const app = express();

// create HTTP server from express app
const httpServer = createServer(app);

// attach Socket.io to the HTTP server
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
initializeChatGateway(io);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/shift-types", shiftTypeRoutes);
app.use("/api/v1/shifts", shiftRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leave", leaveRoutes);
app.use("/api/v1/chat", chatRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "LifeCare API is running" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// use httpServer instead of app to listen
httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await scheduleAttendanceJobs();
});

export default app;
