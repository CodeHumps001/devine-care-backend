import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";

export interface HospitalSettingsInput {
  name: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export const getSettings = async () => {
  const settings = await prisma.hospitalSettings.findFirst();

  if (!settings) {
    throw new AppError(
      "Hospital settings have not been configured yet",
      404,
    );
  }

  return settings;
};

// upsert-style: creates the singleton row on first save, updates it after
export const saveSettings = async (input: HospitalSettingsInput) => {
  const existing = await prisma.hospitalSettings.findFirst();

  if (existing) {
    return prisma.hospitalSettings.update({
      where: { id: existing.id },
      data: input,
    });
  }

  return prisma.hospitalSettings.create({
    data: { ...input, singleton: true },
  });
};
