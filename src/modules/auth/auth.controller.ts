import { Response, Request, NextFunction } from "express";
import { changePassword, loginUser, registerUser } from "./auth.service";
import { AppError } from "../../middlewares/error.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

const register = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      position,
      departmentId,
    } = req.body;
    const nomarlizeEmail = email.toLowerCase();

    await registerUser(
      firstName,
      lastName,
      nomarlizeEmail,
      password,
      role,
      position,
      departmentId,
    );

    res.status(201).json({
      status: "success",
      message: "Account successfully created",
    });
  } catch (err: any) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const nomarlizeEmail = email.toLowerCase();

    const data = await loginUser(nomarlizeEmail, password);
    res.status(200).json({ status: "success", data });
  } catch (err: any) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

const changeMyPassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }
    const userId = req.user.id as string;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError("Current password and new password are required", 400);
    }

    const data = await changePassword(userId, currentPassword, newPassword);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export { register, login, changeMyPassword };
