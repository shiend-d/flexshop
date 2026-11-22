import { getPool, query } from "./db";
import type { Plan, Product, Stats, Transaction } from "./types";

type ProductRow = {
  id: number;
  name: string;
  price: string;
  stock: number;
  created_at: Date;
};

type TransactionRow = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  total_price: string;
  created_at: Date;
};

export type TenantRow = {
  id: number;
  store_name: string;
  email: string;
  password_hash: string;
  plan_type: Plan;
  max_products: number;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    totalPrice: Number(row.total_price),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function findTenantByEmail(
  email: string,
): Promise<TenantRow | null> {
  const rows = await query<TenantRow>(
    `SELECT id, store_name, email, password_hash, plan_type, max_products
     FROM tenants WHERE email = $1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function createTenant(input: {
  storeName: string;
  email: string;
  passwordHash: string;
}): Promise<TenantRow> {
  const rows = await query<TenantRow>(
    `INSERT INTO tenants (store_name, email, password_hash, plan_type, max_products)
     VALUES ($1, $2, $3, 'FREE', 10)
     RETURNING id, store_name, email, password_hash, plan_type, max_products`,
    [input.storeName, input.email, input.passwordHash],
  );
  return rows[0];
}

export async function countProducts(tenantId: number): Promise<number> {
  const rows = await query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM products WHERE tenant_id = $1",
    [tenantId],
  );
  return rows[0]?.count ?? 0;
}

export async function listProducts(tenantId: number): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `SELECT id, name, price, stock, created_at
     FROM products
     WHERE tenant_id = $1
     ORDER BY created_at DESC, id DESC`,
    [tenantId],
  );
  return rows.map(mapProduct);
}

export async function getStats(tenantId: number): Promise<Stats> {
  const [productRow] = await query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM products WHERE tenant_id = $1",
    [tenantId],
  );

  const [transactionRow] = await query<{
    count: number;
    revenue: string;
    items: number;
  }>(
    `SELECT COUNT(*)::int AS count,
            COALESCE(SUM(total_price), 0)::text AS revenue,
            COALESCE(SUM(quantity), 0)::int AS items
     FROM transactions
     WHERE tenant_id = $1`,
    [tenantId],
  );

  return {
    productCount: productRow?.count ?? 0,
    transactionCount: transactionRow?.count ?? 0,
    revenue: Number(transactionRow?.revenue ?? 0),
    itemsSold: transactionRow?.items ?? 0,
  };
}

export async function listTransactions(
  tenantId: number,
  limit = 100,
): Promise<Transaction[]> {
  const rows = await query<TransactionRow>(
    `SELECT t.id, t.product_id, p.name AS product_name,
            t.quantity, t.total_price, t.created_at
     FROM transactions t
     JOIN products p ON p.id = t.product_id AND p.tenant_id = t.tenant_id
     WHERE t.tenant_id = $1
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT $2`,
    [tenantId, limit],
  );
  return rows.map(mapTransaction);
}

export async function createProduct(
  tenantId: number,
  input: { name: string; price: number; stock: number },
): Promise<Product> {
  const rows = await query<ProductRow>(
    `INSERT INTO products (tenant_id, name, price, stock)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, price, stock, created_at`,
    [tenantId, input.name, input.price, input.stock],
  );
  return mapProduct(rows[0]);
}

export async function updateProduct(
  tenantId: number,
  productId: number,
  input: { name?: string; price?: number; stock?: number },
): Promise<Product | null> {
  const rows = await query<ProductRow>(
    `UPDATE products
     SET name = COALESCE($3::text, name),
         price = COALESCE($4::numeric, price),
         stock = COALESCE($5::int, stock)
     WHERE id = $1 AND tenant_id = $2
     RETURNING id, name, price, stock, created_at`,
    [
      productId,
      tenantId,
      input.name ?? null,
      input.price ?? null,
      input.stock ?? null,
    ],
  );
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function deleteProduct(
  tenantId: number,
  productId: number,
): Promise<boolean> {
  const rows = await query<{ id: number }>(
    "DELETE FROM products WHERE id = $1 AND tenant_id = $2 RETURNING id",
    [productId, tenantId],
  );
  return rows.length > 0;
}

export type CreateTransactionResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; reason: "not_found" | "insufficient_stock" };

export async function createTransaction(
  tenantId: number,
  productId: number,
  quantity: number,
): Promise<CreateTransactionResult> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const productResult = await client.query<{
      id: number;
      name: string;
      price: string;
      stock: number;
    }>(
      `SELECT id, name, price, stock
       FROM products
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [productId, tenantId],
    );

    const product = productResult.rows[0];
    if (!product) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "not_found" };
    }

    if (product.stock < quantity) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "insufficient_stock" };
    }

    const totalPrice = Number(product.price) * quantity;

    const transactionResult = await client.query<{
      id: number;
      created_at: Date;
    }>(
      `INSERT INTO transactions (tenant_id, product_id, quantity, total_price)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [tenantId, productId, quantity, totalPrice],
    );

    await client.query(
      `UPDATE products SET stock = stock - $1
       WHERE id = $2 AND tenant_id = $3`,
      [quantity, productId, tenantId],
    );

    await client.query("COMMIT");

    return {
      ok: true,
      transaction: {
        id: transactionResult.rows[0].id,
        productId,
        productName: product.name,
        quantity,
        totalPrice,
        createdAt: new Date(transactionResult.rows[0].created_at).toISOString(),
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
