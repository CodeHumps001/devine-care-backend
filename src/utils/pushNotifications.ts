// utils/pushNotifications.ts
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export const sendPushNotification = async (
  expoPushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, any>,
) => {
  if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
    console.log("Invalid or missing push token, skipping notification");
    return;
  }

  const message: ExpoPushMessage = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: data || {},
  };

  try {
    await expo.sendPushNotificationsAsync([message]);
  } catch (err) {
    console.log("Push notification error:", err);
  }
};
