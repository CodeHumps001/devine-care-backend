import { Request, Response, NextFunction } from "express";
import {
  createDep,
  deleteDep,
  updateDep,
  viewDep,
  viewUniqueDep,
} from "./departments.service";

const createDepartments = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const dep = await createDep(name);
    res.status(201).json({
      status: "success",
      message: "Department created successfully",
      data: dep,
    });
  } catch (err: any) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

const viewDepartments = async (req: Request, res: Response) => {
  try {
    const view = await viewDep();
    res.status(200).json({ status: "success", data: view });
  } catch (err: any) {
    res.status(404).json({ status: "failed", message: err.message });
  }
};

const viewSingleDepartments = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = await viewUniqueDep(id);
    res.status(200).json({ status: "success", data: data });
  } catch (err: any) {
    res.status(404).json({ status: "failed", message: err.message });
  }
};

const updateDepartments = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name } = req.body;
    const data = await updateDep(id, name);
    res.status(200).json({ status: "success", data: data });
  } catch (err: any) {
    res.status(404).json({ status: "failed", message: err.message });
  }
};

const deleteDepartments = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteDep(id);
    res
      .status(200)
      .json({ status: "success", message: "department deleted successfully" });
  } catch (err: any) {
    res.status(404).json({ status: "failed", message: err.message });
  }
};

export {
  createDepartments,
  viewDepartments,
  deleteDepartments,
  updateDepartments,
  viewSingleDepartments,
};
