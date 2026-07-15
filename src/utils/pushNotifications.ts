import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Single recipient, used for 1:1 notifications (leave review, chat, etc.) ──
export const sendPushNotification = async (
  expoPushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, any>,
) => {
  if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) return;
  try {
    await expo.sendPushNotificationsAsync([
      { to: expoPushToken, sound: "default", title, body, data: data || {} },
    ]);
  } catch (err) {
    console.log("Push notification error:", err);
  }
};

// ── Many recipients at once (announcements, shift schedules) ──
// Uses Expo's built-in chunking (max 100 messages/request) with a rest
// period between chunks so we don't hammer the push service or our own
// server in one burst.
export const sendBatchedPushNotifications = async (
  recipients: { expoPushToken: string | null | undefined }[],
  title: string,
  body: string,
  data?: Record<string, any>,
  delayMs: number = 1500,
) => {
  const messages: ExpoPushMessage[] = recipients
    .filter((r) => r.expoPushToken && Expo.isExpoPushToken(r.expoPushToken))
    .map((r) => ({
      to: r.expoPushToken as string,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  console.log(
    `Sending ${messages.length} notifications in ${chunks.length} batch(es)`,
  );

  for (let i = 0; i < chunks.length; i++) {
    try {
      await expo.sendPushNotificationsAsync(chunks[i]);
    } catch (err) {
      console.log(`Batch ${i + 1}/${chunks.length} failed:`, err);
    }
    if (i < chunks.length - 1) {
      await sleep(delayMs);
    }
  }
};
