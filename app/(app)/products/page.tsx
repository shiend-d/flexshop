import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { ProductsManager } from "@/components/products-manager";
import { Pill } from "@/components/ui/pill";
import { requireSession } from "@/lib/auth";
import { listProducts } from "@/lib/queries";

export const instant = false;

export const metadata: Metadata = {
  title: "Produk",
};

export default async function ProductsPage() {
  const session = await requireSession();
  const products = await listProducts(session.id);

  return (
    <div>
      <PageHeading
        label="Inventaris"
        title="Produk"
        description="Kelola barang, harga, dan stok toko Anda."
        action={<Pill>{products.length} produk</Pill>}
      />
      <div className="mt-6">
        <ProductsManager
          products={products}
          plan={session.plan}
          maxProducts={session.maxProducts}
          productCount={products.length}
        />
      </div>
    </div>
  );
}
