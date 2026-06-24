import { Response, Request } from "express";
import { loginUser, registerUser } from "./auth.service";

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

    await registerUser(
      firstName,
      lastName,
      email,
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

    const data = await loginUser(email, password);
    res.status(200).json({ status: "success", data });
  } catch (err: any) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

export { register, login };
