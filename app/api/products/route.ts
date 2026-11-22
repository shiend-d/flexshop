import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { countProducts, createProduct, listProducts } from "@/lib/queries";
import { asNumber, asString, isNonEmpty } from "@/lib/validate";

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
    const products = await listProducts(session.id);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products", error);
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

  const name = asString(body.name);
  const price = asNumber(body.price);
  const stock = asNumber(body.stock);

  if (!isNonEmpty(name, 100)) {
    return NextResponse.json(
      { error: "Nama produk wajib diisi (maksimal 100 karakter)." },
      { status: 400 },
    );
  }
  if (price === null || price < 0) {
    return NextResponse.json(
      { error: "Harga harus berupa angka dan tidak negatif." },
      { status: 400 },
    );
  }
  if (stock === null || !Number.isInteger(stock) || stock < 0) {
    return NextResponse.json(
      { error: "Stok harus berupa bilangan bulat dan tidak negatif." },
      { status: 400 },
    );
  }

  try {
    const total = await countProducts(session.id);
    if (total >= session.maxProducts) {
      return NextResponse.json(
        {
          error: `Batas kuota produk paket ${session.plan} tercapai (${session.maxProducts} produk).`,
        },
        { status: 403 },
      );
    }

    const product = await createProduct(session.id, { name, price, stock });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
