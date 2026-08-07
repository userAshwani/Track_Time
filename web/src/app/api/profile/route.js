import { NextResponse } from "next/server";

import dbConnect from "../../../../lib/dbConnect.js";
import {
  getCurrentUser,
  hashPassword,
  isValidEmail,
  normalizeEmail,
} from "../../../../lib/auth.js";
import User from "../../../../models/User.js";

export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: currentUser,
  });
}

export async function PATCH(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = normalizeEmail(body.email || currentUser.email);
    const password = String(body.password || "");
    const update = {};

    if (name.length > 120) {
      return NextResponse.json(
        { success: false, error: "Name cannot exceed 120 characters." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await dbConnect();

    if (email !== currentUser.email) {
      const existingUser = await User.exists({
        email,
        _id: { $ne: currentUser._id },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "This email is already in use." },
          { status: 409 }
        );
      }

      update.email = email;
    }

    update.name = name;

    if (password) {
      update.passwordHash = hashPassword(password);
      update.passwordUpdatedAt = new Date();
    }

    const updateOperation = password
      ? { $set: update, $addToSet: { authMethods: "password" } }
      : { $set: update };

    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      updateOperation,
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      user: {
        _id: String(updatedUser._id),
        name: updatedUser.name || "",
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("PATCH /api/profile failed.", error);

    return NextResponse.json(
      { success: false, error: "Unable to update profile right now." },
      { status: 500 }
    );
  }
}
