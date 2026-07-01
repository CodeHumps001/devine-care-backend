import Bull from "bull";
import { sendEmail } from "../../config/mailer";
import smsService from "../../config/sms";

export const notificationQueue = new Bull("notifications", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

notificationQueue.process(async (job) => {
  const { type, data } = job.data;

  if (type === "appointment_status") {
    // SMS to patient — always since phone is required
    const smsMessage = `Dear ${data.patientName}, your appointment with Dr. ${data.doctorName} has been ${data.status.toLowerCase()}. Date: ${data.date}. Divine Netcare Hospital.`;
    await smsService.sendSMS(data.patientPhone, smsMessage);

    // email only if patient has one
    if (data.patientEmail) {
      await sendEmail(
        data.patientEmail,
        `Appointment ${data.status} - Divine Netcare Hospital`,
        `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
              .logo { font-size: 24px; font-weight: bold; color: #0ea5e9; }
              .content { padding: 30px 0; }
              .status { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; background-color: #0ea5e9; color: white; }
              .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Divine Netcare Hospital</div>
              </div>
              <div class="content">
                <h2>Appointment Update</h2>
                <p>Dear <strong>${data.patientName}</strong>,</p>
                <p>Your appointment with <strong>Dr. ${data.doctorName}</strong> has been:</p>
                <p><span class="status">${data.status}</span></p>
                <p><strong>Date:</strong> ${data.date}</p>
                <p>If you have any questions please call us directly.</p>
              </div>
              <div class="footer">
                <p>Divine Netcare Hospital · Quality Healthcare For All</p>
              </div>
            </div>
          </body>
          </html>
        `,
      );
    }
  }

  if (type === "job_application_status") {
    const isShortlisted = data.status === "SHORTLISTED";

    const subject = isShortlisted
      ? `Congratulations! Your Application Has Been Shortlisted - Divine Netcare Hospital`
      : `Application Update - Divine Netcare Hospital`;

    const smsMessage = isShortlisted
      ? `Dear ${data.name}, congratulations! Your application for ${data.jobTitle} at Divine Netcare Hospital has been shortlisted. We will contact you soon.`
      : `Dear ${data.name}, thank you for applying for ${data.jobTitle} at Divine Netcare Hospital. Unfortunately your application was not successful this time.`;

    // SMS notification
    await smsService.sendSMS(data.phone, smsMessage);

    // email notification
    await sendEmail(
      data.email,
      subject,
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
            .logo { font-size: 24px; font-weight: bold; color: #0ea5e9; }
            .content { padding: 30px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Divine Netcare Hospital</div>
            </div>
            <div class="content">
              <h2>${subject}</h2>
              <p>Dear <strong>${data.name}</strong>,</p>
              <p>${smsMessage}</p>
              ${isShortlisted ? `<p>Our HR team will reach out to you with the next steps.</p>` : `<p>We encourage you to keep an eye on our careers page for future opportunities.</p>`}
            </div>
            <div class="footer">
              <p>Divine Netcare Hospital · Quality Healthcare For All</p>
            </div>
          </div>
        </body>
        </html>
      `,
    );
  }
});

export const queueAppointmentNotification = async (data: {
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  doctorName: string;
  status: string;
  date: string;
}) => {
  await notificationQueue.add({ type: "appointment_status", data });
};

export const queueJobApplicationNotification = async (data: {
  name: string;
  phone: string;
  email: string;
  jobTitle: string;
  status: string;
}) => {
  await notificationQueue.add({ type: "job_application_status", data });
};
