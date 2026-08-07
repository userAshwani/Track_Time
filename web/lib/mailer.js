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
      <div style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f1f5f9;">
          <tr>
            <td align="center" style="padding:40px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12);">
                <tr>
                  <td style="padding:30px;background:linear-gradient(135deg,#0f172a,#064e3b);">
                    <img src="${logoUrl}" alt="Track Time" width="54" height="54" style="display:block;border-radius:18px;background:#ffffff;margin-bottom:18px;" />
                    <div style="font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#a7f3d0;">Track Time secure access</div>
                    <h1 style="margin:12px 0 0;font-size:30px;line-height:1.15;font-weight:900;color:#ffffff;">Your login verification code</h1>
                    <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#cbd5e1;">Use this code to continue into your Track Time workspace.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 30px;text-align:center;">
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Your one-time password is:</p>
                    <div style="margin:0 auto 22px;padding:24px;border-radius:20px;background:#f8fafc;border:1px solid #e2e8f0;text-align:center;">
                      <div style="font-size:42px;line-height:1;font-weight:900;letter-spacing:12px;color:#0f172a;">${otp}</div>
                    </div>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">This code expires in 10 minutes. If you did not request it, ignore this email and your account will remain secure.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">Track Time keeps daily, weekly, monthly, and annual execution horizons in one trusted dashboard.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}
