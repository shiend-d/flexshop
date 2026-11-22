-- FlexShop — skema multi-tenant (shared database, shared schema)
-- Isolasi data dilakukan dengan kolom tenant_id pada setiap tabel bisnis.

CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'FREE',
    max_products INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);

-- Seeder: password untuk kedua akun adalah "password123"
INSERT INTO tenants (store_name, email, password_hash, plan_type, max_products)
VALUES
    (
        'Toko Kelontong Berkah',
        'berkah@flexshop.id',
        '$2b$10$83HQ6ihwkMHCXDvbtorYhOGYlgB4oBFYHXHfkEI2xyw5S.Au.V6xW',
        'FREE',
        10
    ),
    (
        'Warung Kopi Senja',
        'senja@flexshop.id',
        '$2b$10$83HQ6ihwkMHCXDvbtorYhOGYlgB4oBFYHXHfkEI2xyw5S.Au.V6xW',
        'PRO',
        2147483647
    )
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (tenant_id, name, price, stock)
SELECT t.id, seed.name, seed.price, seed.stock
FROM tenants t
JOIN (
    VALUES
        ('berkah@flexshop.id', 'Beras 5kg', 65000, 20),
        ('berkah@flexshop.id', 'Minyak Goreng 1L', 18000, 30),
        ('berkah@flexshop.id', 'Gula Pasir 1kg', 15000, 25),
        ('senja@flexshop.id', 'Kopi Susu Gula Aren', 22000, 40),
        ('senja@flexshop.id', 'Roti Bakar Coklat', 15000, 35)
) AS seed(email, name, price, stock) ON seed.email = t.email
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE p.tenant_id = t.id AND p.name = seed.name
);
