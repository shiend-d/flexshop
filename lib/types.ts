export type Plan = "FREE" | "PRO";

export type TenantSession = {
  id: number;
  storeName: string;
  plan: Plan;
  maxProducts: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  createdAt: string;
};

export type Transaction = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
};

export type Stats = {
  productCount: number;
  transactionCount: number;
  revenue: number;
  itemsSold: number;
};
