import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../../../lib/auth.js";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({
    success: true,
    authenticated: Boolean(user),
    user,
  });
}
