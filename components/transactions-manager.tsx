"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ReceiptIcon, SpinnerIcon } from "@/components/icons";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectField } from "@/components/ui/field";
import { formatDateTime, formatIDR } from "@/lib/format";
import type { Product, Transaction } from "@/lib/types";

export function TransactionsManager({
  products,
  transactions,
}: {
  products: Product[];
  transactions: Transaction[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const selected = products.find(
    (product) => product.id === Number(productId),
  );
  const qty = Number(quantity) || 0;
  const previewTotal = selected ? selected.price * qty : 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!selected) {
      setFormError("Pilih produk terlebih dahulu.");
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormError("Jumlah harus bilangan bulat lebih dari 0.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selected.id,
          quantity: qty,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormError(data.error ?? "Gagal mencatat transaksi.");
        toast(data.error ?? "Gagal mencatat transaksi.", "error");
        return;
      }

      setProductId("");
      setQuantity("1");
      toast("Transaksi tercatat.");
      router.refresh();
    } catch {
      setFormError("Tidak dapat menghubungi server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
      <Card className="h-fit p-5 sm:p-7">
        <div className="mb-5">
          <h2 className="text-[17px] font-medium text-stone-900 dark:text-stone-50">
            Catat penjualan
          </h2>
          <p className="mt-0.5 text-[13px] text-stone-500 dark:text-stone-400">
            Stok otomatis berkurang setelah transaksi tersimpan.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <SelectField
            id="transaction-product"
            label="Produk"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            required
          >
            <option value="">Pilih produk...</option>
            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
                disabled={product.stock <= 0}
              >
                {product.name} · stok {product.stock}
              </option>
            ))}
          </SelectField>

          <Field
            id="transaction-quantity"
            label="Jumlah"
            type="number"
            min={1}
            step={1}
            max={selected?.stock}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />

          <div className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-white/50 px-4 py-3 transition-colors dark:border-stone-800/80 dark:bg-stone-950/50">
            <span className="text-[11px] font-medium uppercase tracking-[1.54px] text-stone-500 dark:text-stone-400">
              Total
            </span>
            <span className="stat-value font-mono text-[16px] font-medium text-stone-900 dark:text-stone-50">
              {formatIDR(previewTotal)}
            </span>
          </div>

          {selected ? (
            <p className="text-[12px] text-stone-500 dark:text-stone-400">
              Stok tersedia:{" "}
              <span className="font-mono">{selected.stock}</span>
            </p>
          ) : null}

          {formError ? (
            <p className="text-[12px] font-medium text-[#ec003f]">
              {formError}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy || products.length === 0}
            className="w-full"
          >
            {busy ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ReceiptIcon className="h-4 w-4" />
            )}
            {busy ? "Menyimpan..." : "Simpan transaksi"}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="border-b border-stone-200/70 px-5 py-4 dark:border-stone-800/70">
          <h2 className="text-[17px] font-medium text-stone-900 dark:text-stone-50">
            Riwayat transaksi
          </h2>
          <p className="mt-0.5 text-[12.5px] text-stone-500 dark:text-stone-400">
            {transactions.length} transaksi terakhir
          </p>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            title="Belum ada transaksi"
            description="Catat penjualan pertama lewat formulir di samping."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-stone-200/70 text-[10.5px] uppercase tracking-[1.54px] text-stone-400 dark:border-stone-800/70 dark:text-stone-500">
                  <th className="py-2.5 pl-5 pr-4 font-medium">Waktu</th>
                  <th className="py-2.5 pr-4 font-medium">Produk</th>
                  <th className="py-2.5 pr-4 font-medium">Qty</th>
                  <th className="py-2.5 pr-5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-stone-200/50 last:border-0 dark:border-stone-800/50"
                  >
                    <td className="py-3 pl-5 pr-4 font-mono text-[12px] text-stone-500 dark:text-stone-400">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="py-3 pr-4 text-[13.5px] font-medium text-stone-800 dark:text-stone-200">
                      {transaction.productName}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-stone-700 dark:text-stone-300">
                      {transaction.quantity}
                    </td>
                    <td className="py-3 pr-5 text-right font-mono text-[13px] text-stone-800 dark:text-stone-200">
                      {formatIDR(transaction.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
