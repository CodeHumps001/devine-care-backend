import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

//ROUTES IMPORTS
import { router as authRouter } from "./modules/auth/auth.routes";
import { router as departmentRouter } from "./modules/departments/departments.routes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

//ROUTES
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/departments", departmentRouter);

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "LifeCare API is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
