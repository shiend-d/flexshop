import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill, PlanBadge } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { requireSession } from "@/lib/auth";
import {
  formatDateTime,
  formatIDR,
  formatNumber,
} from "@/lib/format";
import { getStats, listProducts, listTransactions } from "@/lib/queries";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const [stats, products, transactions] = await Promise.all([
    getStats(session.id),
    listProducts(session.id),
    listTransactions(session.id, 6),
  ]);

  const isUnlimited = session.plan === "PRO";
  const quotaPct = isUnlimited
    ? 100
    : Math.min(
        100,
        (stats.productCount / Math.max(1, session.maxProducts)) * 100,
      );
  const quotaTone =
    !isUnlimited && quotaPct >= 100
      ? "danger"
      : quotaPct >= 80
        ? "warn"
        : "accent";
  const lowStock = products
    .filter((product) => product.stock <= 5)
    .slice(0, 5);

  return (
    <div>
      <PageHeading
        label="Console"
        title={`Ringkasan ${session.storeName}`}
        description="Angka di bawah hanya menghitung data milik toko Anda."
        action={<PlanBadge plan={session.plan} />}
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Produk"
          value={formatNumber(stats.productCount)}
          hint={
            isUnlimited
              ? "Paket PRO · tanpa batas"
              : `dari ${session.maxProducts} kuota paket`
          }
        >
          <Progress value={quotaPct} tone={quotaTone} />
        </StatCard>
        <StatCard
          label="Total Transaksi"
          value={formatNumber(stats.transactionCount)}
          hint="Seluruh transaksi tercatat"
        />
        <StatCard
          label="Total Pendapatan"
          value={formatIDR(stats.revenue)}
          hint="Akumulasi nilai penjualan"
        />
        <StatCard
          label="Item Terjual"
          value={formatNumber(stats.itemsSold)}
          hint="Total kuantitas terjual"
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-medium text-stone-900 dark:text-stone-50">
              Transaksi terbaru
            </h2>
            <Link
              href="/transactions"
              className="text-[12px] font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            >
              Lihat semua
            </Link>
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              title="Belum ada transaksi"
              description="Catat penjualan pertama Anda di halaman transaksi."
            />
          ) : (
            <div className="chat-box mt-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 border-b border-stone-200/50 py-2.5 last:border-0 dark:border-stone-800/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-stone-800 dark:text-stone-200">
                      {transaction.productName}
                    </p>
                    <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[12.5px] text-stone-800 dark:text-stone-200">
                      {formatIDR(transaction.totalPrice)}
                    </p>
                    <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
                      ×{transaction.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-medium text-stone-900 dark:text-stone-50">
              Stok menipis
            </h2>
            <Pill tone={lowStock.length > 0 ? "warn" : "neutral"}>
              ≤ 5 unit
            </Pill>
          </div>

          {lowStock.length === 0 ? (
            <EmptyState
              title="Stok aman"
              description="Tidak ada produk dengan stok di bawah 6 unit."
            />
          ) : (
            <div className="mt-3">
              {lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 border-b border-stone-200/50 py-2.5 last:border-0 dark:border-stone-800/50"
                >
                  <p className="min-w-0 truncate text-[13px] font-medium text-stone-800 dark:text-stone-200">
                    {product.name}
                  </p>
                  <span className="shrink-0 font-mono text-[12.5px] text-[#c27400] dark:text-[#fe9a00]">
                    {product.stock} unit
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
