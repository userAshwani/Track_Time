import crypto from "node:crypto";

import { cookies } from "next/headers";

import dbConnect from "./dbConnect.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

export const SESSION_COOKIE_NAME = "track_time_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const ADMIN_EMAILS = [
  "dev.ashwanitiwari@gmail.com",
  process.env.SUPERADMIN_EMAIL,
].filter(Boolean).map((email) => normalizeEmail(email));

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function getRoleForEmail(email) {
  return ADMIN_EMAILS.includes(normalizeEmail(email)) ? "superadmin" : "user";
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }

  return secret;
}

export function hashValue(value) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("hex");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto
    .scryptSync(String(password), salt, 64)
    .toString("hex");

  return `${salt}:${passwordHash}`;
}

export function verifyPassword(password, storedPasswordHash) {
  if (!password || !storedPasswordHash || !storedPasswordHash.includes(":")) {
    return false;
  }

  const [salt, hash] = storedPasswordHash.split(":");
  const candidate = crypto
    .scryptSync(String(password), salt, 64)
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

export function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(email, otp) {
  return hashValue(`${normalizeEmail(email)}:${otp}`);
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function setSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE_NAME, token, getCookieOptions());
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
}

export async function createSession(user, request) {
  await dbConnect();

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await Session.create({
    userId: user._id,
    tokenHash: hashValue(token),
    expiresAt,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") || "",
  });

  return token;
}

export async function getCurrentUser() {
  await dbConnect();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await Session.findOne({
    tokenHash: hashValue(token),
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  }).lean();

  if (!session) {
    return null;
  }

  const user = await User.findOne({
    _id: session.userId,
    status: "active",
  }).lean();

  if (!user) {
    return null;
  }

  return {
    _id: String(user._id),
    name: user.name || "",
    email: user.email,
    role: getRoleForEmail(user.email) === "superadmin" ? "superadmin" : user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    username: user.username || "",
    publicProfile: Boolean(user.publicProfile),
  };
}

export async function revokeCurrentSession() {
  await dbConnect();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return;
  }

  await Session.updateOne(
    { tokenHash: hashValue(token), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}
