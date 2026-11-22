import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteProduct, updateProduct } from "@/lib/queries";
import { asNumber, asString, isNonEmpty } from "@/lib/validate";

type RouteParams = { params: Promise<{ id: string }> };

async function readBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Tidak terautentikasi." },
      { status: 401 },
    );
  }

  const { id: rawId } = await params;
  const productId = parseId(rawId);
  if (productId === null) {
    return NextResponse.json(
      { error: "ID produk tidak valid." },
      { status: 400 },
    );
  }

  const body = await readBody(request);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const input: { name?: string; price?: number; stock?: number } = {};

  if ("name" in body) {
    const name = asString(body.name);
    if (!isNonEmpty(name, 100)) {
      return NextResponse.json(
        { error: "Nama produk wajib diisi (maksimal 100 karakter)." },
        { status: 400 },
      );
    }
    input.name = name;
  }

  if ("price" in body) {
    const price = asNumber(body.price);
    if (price === null || price < 0) {
      return NextResponse.json(
        { error: "Harga harus berupa angka dan tidak negatif." },
        { status: 400 },
      );
    }
    input.price = price;
  }

  if ("stock" in body) {
    const stock = asNumber(body.stock);
    if (stock === null || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Stok harus berupa bilangan bulat dan tidak negatif." },
        { status: 400 },
      );
    }
    input.stock = stock;
  }

  if (Object.keys(input).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada perubahan yang dikirim." },
      { status: 400 },
    );
  }

  try {
    const product = await updateProduct(session.id, productId, input);
    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("PATCH /api/products/[id]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Tidak terautentikasi." },
      { status: 401 },
    );
  }

  const { id: rawId } = await params;
  const productId = parseId(rawId);
  if (productId === null) {
    return NextResponse.json(
      { error: "ID produk tidak valid." },
      { status: 400 },
    );
  }

  try {
    const deleted = await deleteProduct(session.id, productId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "23503"
    ) {
      return NextResponse.json(
        {
          error:
            "Produk tidak bisa dihapus karena sudah memiliki riwayat transaksi.",
        },
        { status: 409 },
      );
    }
    console.error("DELETE /api/products/[id]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
