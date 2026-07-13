import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";
import { getSettings, saveSettings } from "./settings.service";

export const viewSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getSettings();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, latitude, longitude, geofenceRadius, address, phone, email, logoUrl } =
      req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      throw new AppError("name, latitude and longitude are required", 400);
    }

    const data = await saveSettings({
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
      geofenceRadius: geofenceRadius !== undefined ? Number(geofenceRadius) : 100,
      address,
      phone,
      email,
      logoUrl,
    });

    res.status(200).json({ status: "success", data, message: "Hospital settings saved" });
  } catch (err) {
    next(err);
  }
};
