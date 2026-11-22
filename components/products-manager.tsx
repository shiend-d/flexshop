"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AlertIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/icons";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Pill } from "@/components/ui/pill";
import { formatDate, formatIDR } from "@/lib/format";
import type { Plan, Product } from "@/lib/types";

export function ProductsManager({
  products,
  plan,
  maxProducts,
  productCount,
}: {
  products: Product[];
  plan: Plan;
  maxProducts: number;
  productCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<"create" | "edit" | "delete" | null>(null);

  const [editing, setEditing] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  const [deleting, setDeleting] = useState<Product | null>(null);

  const atLimit = productCount >= maxProducts;
  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setBusy("create");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          stock: Number(stock),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormError(data.error ?? "Gagal menambah produk.");
        toast(data.error ?? "Gagal menambah produk.", "error");
        return;
      }

      setName("");
      setPrice("");
      setStock("");
      toast("Produk ditambahkan.");
      router.refresh();
    } catch {
      setFormError("Tidak dapat menghubungi server.");
    } finally {
      setBusy(null);
    }
  }

  function openEdit(product: Product) {
    setEditing(product);
    setEditName(product.name);
    setEditPrice(String(product.price));
    setEditStock(String(product.stock));
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy("edit");

    try {
      const response = await fetch(`/api/products/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          price: Number(editPrice),
          stock: Number(editStock),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast(data.error ?? "Gagal menyimpan produk.", "error");
        return;
      }

      setEditing(null);
      toast("Produk diperbarui.");
      router.refresh();
    } catch {
      toast("Tidak dapat menghubungi server.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    setBusy("delete");

    try {
      const response = await fetch(`/api/products/${deleting.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast(data.error ?? "Gagal menghapus produk.", "error");
        return;
      }

      setDeleting(null);
      toast("Produk dihapus.");
      router.refresh();
    } catch {
      toast("Tidak dapat menghubungi server.", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[17px] font-medium text-stone-900 dark:text-stone-50">
              Produk baru
            </h2>
            <p className="mt-0.5 text-[13px] text-stone-500 dark:text-stone-400">
              Tambahkan barang dagangan untuk toko ini.
            </p>
          </div>
          <Pill tone={atLimit ? "warn" : "neutral"}>
            {plan === "PRO" ? "PRO · tanpa batas" : `${productCount} / ${maxProducts} produk`}
          </Pill>
        </div>

        {atLimit ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#fe9a00]/25 bg-[#fe9a00]/10 px-4 py-2.5 text-[12.5px] text-[#a86a00] dark:text-[#fe9a00]">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            Kuota produk paket {plan} sudah penuh. Hapus produk lama atau
            gunakan paket PRO.
          </div>
        ) : null}

        <form
          onSubmit={onCreate}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6"
        >
          <Field
            id="product-name"
            label="Nama Produk"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Beras 5kg"
            maxLength={100}
            className="flex-[2]"
            required
            disabled={atLimit}
          />
          <Field
            id="product-price"
            label="Harga (Rp)"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="65000"
            className="flex-1"
            required
            disabled={atLimit}
          />
          <Field
            id="product-stock"
            label="Stok"
            type="number"
            min={0}
            step={1}
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            placeholder="20"
            className="flex-1"
            required
            disabled={atLimit}
          />
          <Button
            type="submit"
            disabled={busy === "create" || atLimit}
            className="whitespace-nowrap"
          >
            {busy === "create" ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            Tambah
          </Button>
        </form>

        {formError ? (
          <p className="mt-3 text-[12px] font-medium text-[#ec003f]">
            {formError}
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="flex flex-col gap-3 border-b border-stone-200/70 px-5 py-4 dark:border-stone-800/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[17px] font-medium text-stone-900 dark:text-stone-50">
              Daftar produk
            </h2>
            <p className="mt-0.5 text-[12.5px] text-stone-500 dark:text-stone-400">
              {products.length} produk tercatat
            </p>
          </div>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari produk..."
              className="w-full border-0 border-b border-stone-200 bg-transparent py-1.5 pl-6 font-mono text-[13px] text-stone-800 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none dark:border-stone-800 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-stone-100 sm:w-56"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={products.length === 0 ? "Belum ada produk" : "Produk tidak ditemukan"}
            description={
              products.length === 0
                ? "Tambahkan produk pertama lewat formulir di atas."
                : "Coba kata kunci lain."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-stone-200/70 text-[10.5px] uppercase tracking-[1.54px] text-stone-400 dark:border-stone-800/70 dark:text-stone-500">
                  <th className="py-2.5 pl-5 pr-4 font-medium">Produk</th>
                  <th className="py-2.5 pr-4 font-medium">Harga</th>
                  <th className="py-2.5 pr-4 font-medium">Stok</th>
                  <th className="hidden py-2.5 pr-4 font-medium sm:table-cell">
                    Dibuat
                  </th>
                  <th className="py-2.5 pr-5 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-stone-200/50 last:border-0 dark:border-stone-800/50"
                  >
                    <td className="py-3 pl-5 pr-4 text-[13.5px] font-medium text-stone-800 dark:text-stone-200">
                      {product.name}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-stone-700 dark:text-stone-300">
                      {formatIDR(product.price)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-mono text-[13px] ${
                          product.stock <= 5
                            ? "text-[#c27400] dark:text-[#fe9a00]"
                            : "text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="hidden py-3 pr-4 font-mono text-[12px] text-stone-500 dark:text-stone-400 sm:table-cell">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          title="Ubah produk"
                          aria-label={`Ubah ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white/60 text-stone-500 transition-colors hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:bg-stone-800"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(product)}
                          title="Hapus produk"
                          aria-label={`Hapus ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ec003f]/20 bg-[#ec003f]/10 text-[#ec003f] transition-colors hover:bg-[#ec003f]/20"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Ubah produk"
        description="Perbarui nama, harga, atau stok produk."
      >
        <form onSubmit={onEdit} className="space-y-5">
          <Field
            id="edit-name"
            label="Nama Produk"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            maxLength={100}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="edit-price"
              label="Harga (Rp)"
              type="number"
              min={0}
              step={1}
              value={editPrice}
              onChange={(event) => setEditPrice(event.target.value)}
              required
            />
            <Field
              id="edit-stock"
              label="Stok"
              type="number"
              min={0}
              step={1}
              value={editStock}
              onChange={(event) => setEditStock(event.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy === "edit"}>
              {busy === "edit" ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Hapus produk"
        description={
          deleting
            ? `Hapus "${deleting.name}"? Tindakan ini tidak bisa dibatalkan.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            disabled={busy === "delete"}
          >
            {busy === "delete" ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
