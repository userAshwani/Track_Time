import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/dbConnect.js";
import {
  createSession,
  getRoleForEmail,
  getClientIp,
  hashPassword,
  isValidEmail,
  normalizeEmail,
  setSessionCookie,
  verifyPassword,
} from "../../../../../lib/auth.js";
import User from "../../../../../models/User.js";

export const runtime = "nodejs";

function getConfiguredAdmin() {
  return {
    email: normalizeEmail(process.env.ADMIN_LOGIN_EMAIL || "admin@gmail.com"),
    password: process.env.ADMIN_LOGIN_PASSWORD || "123456789",
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Enter your password." },
        { status: 400 }
      );
    }

    await dbConnect();

    const configuredAdmin = getConfiguredAdmin();
    const isConfiguredAdmin =
      email === configuredAdmin.email && password === configuredAdmin.password;

    const userAgent = request.headers.get("user-agent") || "";
    const lastIp = getClientIp(request);
    const loginAt = new Date();
    let user = await User.findOne({ email }).select("+passwordHash");

    if (isConfiguredAdmin) {
      if (!user) {
        user = await User.create({
          name: "Admin",
          email,
          role: "superadmin",
          status: "active",
          passwordHash: hashPassword(password),
          passwordUpdatedAt: loginAt,
          authMethods: ["password"],
          loginCount: 1,
          lastLoginAt: loginAt,
          lastIp,
          lastUserAgent: userAgent,
        });
      } else {
        user.name = user.name || "Admin";
        user.role = "superadmin";
        user.status = "active";
        user.passwordHash = user.passwordHash || hashPassword(password);
        user.passwordUpdatedAt = user.passwordUpdatedAt || loginAt;
        user.authMethods = Array.from(new Set([...(user.authMethods || []), "password"]));
        user.loginCount += 1;
        user.lastLoginAt = loginAt;
        user.lastIp = lastIp;
        user.lastUserAgent = userAgent;
        await user.save();
      }
    } else {
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password." },
          { status: 401 }
        );
      }

      if (user.status !== "active") {
        return NextResponse.json(
          { success: false, error: "This account is disabled." },
          { status: 403 }
        );
      }

      user.loginCount += 1;
      user.lastLoginAt = loginAt;
      user.lastIp = lastIp;
      user.lastUserAgent = userAgent;
      user.role = getRoleForEmail(email);
      await user.save();
    }

    const token = await createSession(user, request);
    const response = NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("POST /api/auth/password-login failed.", error);

    return NextResponse.json(
      { success: false, error: "Unable to sign in right now." },
      { status: 500 }
    );
  }
}
