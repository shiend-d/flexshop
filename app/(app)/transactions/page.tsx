import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { TransactionsManager } from "@/components/transactions-manager";
import { Pill } from "@/components/ui/pill";
import { requireSession } from "@/lib/auth";
import { listProducts, listTransactions } from "@/lib/queries";

export const instant = false;

export const metadata: Metadata = {
  title: "Transaksi",
};

export default async function TransactionsPage() {
  const session = await requireSession();
  const [products, transactions] = await Promise.all([
    listProducts(session.id),
    listTransactions(session.id),
  ]);

  return (
    <div>
      <PageHeading
        label="Kasir"
        title="Transaksi"
        description="Catat penjualan dan pantau riwayat transaksi toko."
        action={<Pill>{transactions.length} transaksi</Pill>}
      />
      <div className="mt-6">
        <TransactionsManager
          products={products}
          transactions={transactions}
        />
      </div>
    </div>
  );
}
