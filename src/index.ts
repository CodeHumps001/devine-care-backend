import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

//ROUTES IMPORTS
import { router as authRouter } from "./modules/auth/auth.routes";
import { router as departmentRouter } from "./modules/departments/departments.routes";
import { router as userRoutes } from "./modules/users/users.routes";
import { errorHandler } from "./middlewares/error.middleware";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

//ROUTES
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/users", userRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "LifeCare API is running" });
});

app.use(errorHandler);
//

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
