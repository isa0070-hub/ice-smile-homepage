import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_auth";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const SESSION_VERSION = 1;
const SESSION_SUBJECT = "admin";
const MAX_CLOCK_SKEW_SECONDS = 60;
const MIN_SECRET_BYTES = 32;
const MAX_TOKEN_LENGTH = 1024;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (
    typeof secret !== "string" ||
    Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES
  ) {
    return null;
  }

  return secret;
}

function sign(encodedPayload, secret) {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

function hasValidSignature(encodedPayload, signature, secret) {
  try {
    const actual = Buffer.from(signature, "base64url");
    const expected = Buffer.from(sign(encodedPayload, secret), "base64url");

    return (
      actual.toString("base64url") === signature &&
      actual.length === expected.length &&
      timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

export function isAdminSessionConfigured() {
  return Boolean(getSessionSecret());
}

export function createAdminSessionToken(now = Date.now()) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET must contain at least 32 bytes.",
    );
  }

  const issuedAt = Math.floor(now / 1000);
  const payload = {
    v: SESSION_VERSION,
    sub: SESSION_SUBJECT,
    iat: issuedAt,
    exp: issuedAt + ADMIN_SESSION_MAX_AGE,
    nonce: randomBytes(16).toString("base64url"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyAdminSessionToken(token, now = Date.now()) {
  const secret = getSessionSecret();

  if (
    !secret ||
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [encodedPayload, signature] = parts;

  if (!hasValidSignature(encodedPayload, signature, secret)) {
    return false;
  }

  try {
    const payloadBuffer = Buffer.from(encodedPayload, "base64url");

    if (payloadBuffer.toString("base64url") !== encodedPayload) {
      return false;
    }

    const payload = JSON.parse(payloadBuffer.toString("utf8"));
    const currentTime = Math.floor(now / 1000);

    return (
      payload?.v === SESSION_VERSION &&
      payload?.sub === SESSION_SUBJECT &&
      Number.isInteger(payload?.iat) &&
      Number.isInteger(payload?.exp) &&
      typeof payload?.nonce === "string" &&
      payload.nonce.length >= 20 &&
      payload.iat <= currentTime + MAX_CLOCK_SKEW_SECONDS &&
      payload.exp > currentTime &&
      payload.exp - payload.iat === ADMIN_SESSION_MAX_AGE
    );
  } catch {
    return false;
  }
}

export function getAdminSessionCookieOptions(now = Date.now()) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
    expires: new Date(now + ADMIN_SESSION_MAX_AGE * 1000),
  };
}

export function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!origin || (fetchSite && fetchSite !== "same-origin")) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
