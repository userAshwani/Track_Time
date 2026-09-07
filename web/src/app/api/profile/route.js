import { NextResponse } from "next/server";

import dbConnect from "../../../../lib/dbConnect.js";
import {
  getCurrentUser,
  hashPassword,
  isValidEmail,
  normalizeEmail,
} from "../../../../lib/auth.js";
import User from "../../../../models/User.js";
import { RESERVED_USERNAMES } from "../../../../lib/streak.js";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,19}$/;

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
    const usernameProvided = Object.prototype.hasOwnProperty.call(body, "username");
    const username = usernameProvided ? String(body.username || "").trim().toLowerCase() : null;
    const publicProfileProvided = Object.prototype.hasOwnProperty.call(body, "publicProfile");
    const publicProfile = Boolean(body.publicProfile);
    const update = {};

    if (name.length > 120) {
      return NextResponse.json(
        { success: false, error: "Name cannot exceed 120 characters." },
        { status: 400 }
      );
    }

    if (usernameProvided) {
      if (!USERNAME_PATTERN.test(username)) {
        return NextResponse.json(
          { success: false, error: "Username must be 3-20 characters: lowercase letters, numbers, - or _, starting with a letter or number." },
          { status: 400 }
        );
      }

      if (RESERVED_USERNAMES.has(username)) {
        return NextResponse.json(
          { success: false, error: "This username is reserved. Choose another." },
          { status: 400 }
        );
      }
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

    if (usernameProvided && username !== currentUser.username) {
      const existingUsername = await User.exists({
        username,
        _id: { $ne: currentUser._id },
      });

      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: "This username is already taken." },
          { status: 409 }
        );
      }

      update.username = username;
    }

    if (publicProfileProvided) {
      if (publicProfile && !(usernameProvided ? username : currentUser.username)) {
        return NextResponse.json(
          { success: false, error: "Choose a username before making your profile public." },
          { status: 400 }
        );
      }

      update.publicProfile = publicProfile;
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
        username: updatedUser.username || "",
        publicProfile: Boolean(updatedUser.publicProfile),
      },
    });
  } catch (error) {
    console.error("PATCH /api/profile failed.", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "This username is already taken." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to update profile right now." },
      { status: 500 }
    );
  }
}
