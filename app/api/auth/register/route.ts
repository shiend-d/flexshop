import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { createTenant, findTenantByEmail } from "@/lib/queries";
import type { TenantSession } from "@/lib/types";
import { asString, isEmail, isNonEmpty } from "@/lib/validate";

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

  const storeName = asString(body.store_name);
  const email = asString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!isNonEmpty(storeName, 100)) {
    return NextResponse.json(
      { error: "Nama toko wajib diisi (maksimal 100 karakter)." },
      { status: 400 },
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "Format email tidak valid." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter." },
      { status: 400 },
    );
  }

  try {
    const existing = await findTenantByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);
    const tenant = await createTenant({
      storeName,
      email,
      passwordHash,
    });

    const session: TenantSession = {
      id: tenant.id,
      storeName: tenant.store_name,
      plan: tenant.plan_type,
      maxProducts: tenant.max_products,
    };

    const response = NextResponse.json({ tenant: session }, { status: 201 });
    await setSessionCookie(response, session);
    return response;
  } catch (error) {
    console.error("POST /api/auth/register", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
