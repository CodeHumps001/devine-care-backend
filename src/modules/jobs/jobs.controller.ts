import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import {
  postJob,
  getJobs,
  updateJobListings,
  deleteJobs,
  postApplications,
  getApplications,
  updateApplicationStatus,
} from "./jobs.service";

export const createJobs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { title, department, type, description } = req.body;
    if (!title || !department || !type || !description) {
      throw new AppError("All fields are required", 400);
    }
    const data = await postJob(title, department, type, description);
    res.status(201).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const viewJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getJobs();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const updateJob = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const data = await updateJobListings(id, req.body);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const delJob = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    await deleteJobs(id);
    res.status(200).json({ status: "success", message: "Job listing deleted" });
  } catch (err) {
    next(err);
  }
};

export const createAplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, phone, cvUrl, coverLetter } = req.body;
    const jobListingId = req.params.id as string;
    if (!name || !phone || !cvUrl) {
      throw new AppError("Name, phone and CV are required", 400);
    }
    const data = await postApplications(
      jobListingId,
      name,
      email,
      phone,
      cvUrl,
      coverLetter,
    );
    res.status(201).json({
      status: "success",
      message: "Application submitted successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const viewApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getApplications();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const updateApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const data = await updateApplicationStatus(id, status);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
