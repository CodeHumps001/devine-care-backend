export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY as string,
    },
    body: JSON.stringify({
      sender: {
        name: "Divine Netcare Hospital",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Brevo API error:", errorData);
    throw new Error("Failed to send email");
  }
};
