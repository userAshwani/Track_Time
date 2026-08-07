import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/dbConnect.js";
import {
  createSession,
  getClientIp,
  hashOtp,
  isValidEmail,
  normalizeEmail,
  setSessionCookie,
} from "../../../../../lib/auth.js";
import OtpToken from "../../../../../models/OtpToken.js";
import User from "../../../../../models/User.js";

export const runtime = "nodejs";

function getRoleForEmail(email) {
  return email === normalizeEmail(process.env.SUPERADMIN_EMAIL)
    ? "superadmin"
    : "user";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const otp = String(body.otp || "").trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: "Enter the 6 digit OTP." },
        { status: 400 }
      );
    }

    await dbConnect();

    const otpRecord = await OtpToken.findOne({
      email,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select("+otpHash");

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "OTP expired or not found. Request a new OTP." },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { success: false, error: "Too many OTP attempts. Request a new OTP." },
        { status: 429 }
      );
    }

    if (otpRecord.otpHash !== hashOtp(email, otp)) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return NextResponse.json(
        { success: false, error: "Incorrect OTP." },
        { status: 400 }
      );
    }

    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    const role = getRoleForEmail(email);
    const userAgent = request.headers.get("user-agent") || "";
    const lastIp = getClientIp(request);
    const loginAt = new Date();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        role,
        status: "active",
        loginCount: 1,
        lastLoginAt: loginAt,
        lastIp,
        lastUserAgent: userAgent,
      });
    } else {
      user = await User.findOneAndUpdate(
        { email },
        {
          $set: {
            role,
            status: "active",
            lastLoginAt: loginAt,
            lastIp,
            lastUserAgent: userAgent,
          },
          $inc: { loginCount: 1 },
        },
        {
          new: true,
        }
      );
    }

    if (!user) {
      throw new Error("User login could not be completed.");
    }

    const token = await createSession(user, request);
    const response = NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
      },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("POST /api/auth/verify-otp failed.", error);

    return NextResponse.json(
      { success: false, error: "Unable to verify OTP right now." },
      { status: 500 }
    );
  }
}
