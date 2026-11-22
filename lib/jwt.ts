import { SignJWT, jwtVerify } from "jose";
import type { Plan, TenantSession } from "./types";

export const SESSION_COOKIE = "flexshop_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "flexshop-dev-secret-change-me",
);

export async function signSession(session: TenantSession): Promise<string> {
  return new SignJWT({
    storeName: session.storeName,
    plan: session.plan,
    maxProducts: session.maxProducts,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(session.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySession(
  token: string | undefined | null,
): Promise<TenantSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;

    const plan: Plan = payload.plan === "PRO" ? "PRO" : "FREE";
    const maxProducts = Number(payload.maxProducts);

    return {
      id: Number(payload.sub),
      storeName: String(payload.storeName ?? ""),
      plan,
      maxProducts: Number.isFinite(maxProducts) ? maxProducts : 10,
    };
  } catch {
    return null;
  }
}
