import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("SMTP email configuration is missing.");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendOtpEmail(email, otp) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from,
    to: email,
    subject: "Your Track Time login OTP",
    text: `Your Track Time OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Track Time secure login</h2>
        <p>Your one-time password is:</p>
        <p style="font-size: 28px; font-weight: 800; letter-spacing: 4px;">${otp}</p>
        <p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>
      </div>
    `,
  });
}
