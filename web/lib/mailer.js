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
  const logoUrl = "https://ashwanitiwari.com/logo.png";

  await getTransporter().sendMail({
    from,
    to: email,
    subject: "Your Track Time login OTP",
    text: `Your Track Time OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="margin:0;padding:32px;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,0.08);">
          <div style="padding:28px;background:linear-gradient(135deg,#0f172a,#064e3b);color:#ffffff;">
            <img src="${logoUrl}" alt="Track Time" width="48" height="48" style="border-radius:16px;display:block;margin-bottom:18px;" />
            <div style="font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#a7f3d0;">Track Time secure access</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;font-weight:800;">Your one-time login code</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0;font-size:16px;line-height:1.6;color:#475569;">Use this OTP to finish signing in. New users are registered automatically after verification.</p>
            <div style="margin:24px 0;padding:22px;border-radius:18px;background:#ecfdf5;border:1px solid #a7f3d0;text-align:center;">
              <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#047857;">${otp}</div>
            </div>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
          </div>
        </div>
      </div>
    `,
  });
}
