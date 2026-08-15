import { NextResponse } from "next/server";

import dbConnect from "../../../../lib/dbConnect.js";
import { getCurrentUser, normalizeEmail } from "../../../../lib/auth.js";
import { sendFeedbackEmail } from "../../../../lib/mailer.js";
import Feedback, { FEEDBACK_TYPES } from "../../../../models/Feedback.js";

export const runtime = "nodejs";

function jsonResponse(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return jsonResponse({ success: false, error: "Authentication required." }, 401);
    }

    const body = await request.json();
    const type = FEEDBACK_TYPES.includes(body.type) ? body.type : "suggestion";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const rating = body.rating ? Number(body.rating) : null;

    if (!message) {
      return jsonResponse({ success: false, error: "Write a suggestion or review first." }, 400);
    }

    await dbConnect();
    const feedback = await Feedback.create({
      userId: currentUser._id,
      type,
      message,
      rating: rating >= 1 && rating <= 5 ? rating : null,
    });

    try {
      await sendFeedbackEmail({
        adminEmail: normalizeEmail(process.env.ADMIN_FEEDBACK_EMAIL || "dev.ashwanitiwari@gmail.com"),
        user: currentUser,
        feedback,
      });
    } catch (emailError) {
      console.error("Feedback email failed.", emailError);
    }

    return jsonResponse({ success: true, data: feedback }, 201);
  } catch (error) {
    console.error("POST /api/feedback failed.", error);
    return jsonResponse({ success: false, error: "Unable to submit feedback." }, 500);
  }
}
