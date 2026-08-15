import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/dbConnect.js";
import { createOtp, hashOtp, isValidEmail, normalizeEmail } from "../../../../../lib/auth.js";
import { sendOtpEmail } from "../../../../../lib/mailer.js";
import OtpToken from "../../../../../models/OtpToken.js";

export const runtime = "nodejs";

const OTP_TTL_MINUTES = 10;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    await dbConnect();

    const otp = createOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await OtpToken.updateMany(
      { email, consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );

    await OtpToken.create({
      email,
      otpHash: hashOtp(email, otp),
      expiresAt,
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent. Check your email.",
    });
  } catch (error) {
    console.error("POST /api/auth/request-otp failed.", error);

    if (error.message === "SMTP email configuration is missing.") {
      return NextResponse.json(
        { success: false, error: "Email login is not configured on this server. Add SMTP variables in Vercel." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to send OTP right now." },
      { status: 500 }
    );
  }
}
