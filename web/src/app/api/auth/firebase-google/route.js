import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/dbConnect.js";
import {
  createSession,
  getRoleForEmail,
  getClientIp,
  normalizeEmail,
  setSessionCookie,
} from "../../../../../lib/auth.js";
import User from "../../../../../models/User.js";

export const runtime = "nodejs";

async function verifyFirebaseIdToken(idToken) {
  const apiKey =
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyCc3HBdYRbAyMxDdHd5GHZDQbW4s0BqXVI";

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
  const payload = await response.json();

  if (!response.ok || !payload.users?.[0]) {
    throw new Error(payload.error?.message || "Firebase token verification failed.");
  }

  return payload.users[0];
}

export async function POST(request) {
  try {
    const body = await request.json();
    const idToken = String(body.idToken || "").trim();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Firebase ID token is required." },
        { status: 400 }
      );
    }

    const firebaseUser = await verifyFirebaseIdToken(idToken);
    const email = normalizeEmail(firebaseUser.email);

    if (!email || firebaseUser.emailVerified === false) {
      return NextResponse.json(
        { success: false, error: "A verified Google email is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const loginAt = new Date();
    const userAgent = request.headers.get("user-agent") || "";
    const lastIp = getClientIp(request);
    const role = getRoleForEmail(email);
    const name = firebaseUser.displayName || email.split("@")[0].replace(/[._-]+/g, " ");
    const profilePicture = firebaseUser.photoUrl || "";

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          role,
          status: "active",
          lastLoginAt: loginAt,
          lastIp,
          lastUserAgent: userAgent,
          profilePicture,
        },
        $addToSet: { authMethods: "google" },
        $inc: { loginCount: 1 },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const token = await createSession(user, request);
    const response = NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name || "",
        email: user.email,
        role: user.role,
      },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("POST /api/auth/firebase-google failed.", error);

    return NextResponse.json(
      { success: false, error: "Unable to sign in with Google right now." },
      { status: 500 }
    );
  }
}
