import Bull from "bull";

export const attendanceQueue = new Bull("attendance", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});
