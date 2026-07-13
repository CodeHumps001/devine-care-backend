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
import { router as announcementRoutes } from "./modules/announcements/announcements.routes";
import { router as postRoutes } from "./modules/posts/posts.routes";
import { router as jobRoutes } from "./modules/jobs/jobs.routes";
import { router as reviewRoutes } from "./modules/reviews/reviews.routes";
import { router as appointmentRoutes } from "./modules/appointments/appointments.routes";
import { router as settingsRoutes } from "./modules/settings/settings.routes"; // NEW
import { router as uploadRouter } from "./modules/upload/upload.routes";
import { router as feedbackRouter } from "./modules/feedback/feedback.routes";

import { errorHandler } from "./middlewares/error.middleware";
import { scheduleAttendanceJobs } from "./jobs/attendance.jobs";
import { initializeChatGateway } from "./modules/chat/chat.gateway";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { sendEmail } from "./config/mailer";

dotenv.config();

const app = express();
const router = express.Router();

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
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/shift-types", shiftTypeRoutes);
app.use("/api/v1/shifts", shiftRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leave", leaveRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/settings", settingsRoutes); // NEW
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/feedback", feedbackRouter);

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
