import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTransaction, listTransactions } from "@/lib/queries";
import { asNumber } from "@/lib/validate";

async function readBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Tidak terautentikasi." },
      { status: 401 },
    );
  }

  try {
    const transactions = await listTransactions(session.id);
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("GET /api/transactions", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Tidak terautentikasi." },
      { status: 401 },
    );
  }

  const body = await readBody(request);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const productId = asNumber(body.product_id);
  const quantity = asNumber(body.quantity);

  if (productId === null || !Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json(
      { error: "Produk tidak valid." },
      { status: 400 },
    );
  }
  if (quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "Jumlah harus bilangan bulat lebih dari 0." },
      { status: 400 },
    );
  }

  try {
    const result = await createTransaction(session.id, productId, quantity);

    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json(
          { error: "Produk tidak ditemukan." },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Stok tidak mencukupi." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { transaction: result.transaction },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/transactions", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
