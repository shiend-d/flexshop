import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { findTenantByEmail } from "@/lib/queries";
import type { TenantSession } from "@/lib/types";
import { asString, isEmail } from "@/lib/validate";

async function readBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await readBody(request);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const email = asString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!isEmail(email) || password.length === 0) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const tenant = await findTenantByEmail(email);
    const valid = tenant
      ? await compare(password, tenant.password_hash)
      : false;

    if (!tenant || !valid) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 },
      );
    }

    const session: TenantSession = {
      id: tenant.id,
      storeName: tenant.store_name,
      plan: tenant.plan_type,
      maxProducts: tenant.max_products,
    };

    const response = NextResponse.json({ tenant: session });
    await setSessionCookie(response, session);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
