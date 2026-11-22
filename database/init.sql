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

-- Akun dummy untuk demo. Password semua akun: admin123
-- Paket PRO agar tiap toko bisa menampung 15-30 produk.
INSERT INTO tenants (store_name, email, password_hash, plan_type, max_products)
VALUES
    (
        'Toko Dummy 1',
        'toko1@gmail.com',
        '$2b$10$h.JO6AM/zhe.4RoxuwzVReN25NELzXaVVO4bHj.Esz5lOkvirYAmW',
        'PRO',
        2147483647
    ),
    (
        'Toko Dummy 2',
        'toko2@gmail.com',
        '$2b$10$h.JO6AM/zhe.4RoxuwzVReN25NELzXaVVO4bHj.Esz5lOkvirYAmW',
        'PRO',
        2147483647
    ),
    (
        'Toko Dummy 3',
        'toko3@gmail.com',
        '$2b$10$h.JO6AM/zhe.4RoxuwzVReN25NELzXaVVO4bHj.Esz5lOkvirYAmW',
        'PRO',
        2147483647
    ),
    (
        'Toko Dummy 4',
        'toko4@gmail.com',
        '$2b$10$h.JO6AM/zhe.4RoxuwzVReN25NELzXaVVO4bHj.Esz5lOkvirYAmW',
        'PRO',
        2147483647
    ),
    (
        'Toko Dummy 5',
        'toko5@gmail.com',
        '$2b$10$h.JO6AM/zhe.4RoxuwzVReN25NELzXaVVO4bHj.Esz5lOkvirYAmW',
        'PRO',
        2147483647
    )
ON CONFLICT (email) DO NOTHING;

-- Isi tiap toko dengan 15-30 produk dari katalog yang sama.
WITH store_plan(email, total) AS (
    VALUES
        ('toko1@gmail.com', 15),
        ('toko2@gmail.com', 18),
        ('toko3@gmail.com', 21),
        ('toko4@gmail.com', 25),
        ('toko5@gmail.com', 30)
),
catalog(ord, product_name, price, stock) AS (
    VALUES
        (1, 'Beras Premium 5kg', 72000, 40),
        (2, 'Beras Medium 5kg', 62000, 35),
        (3, 'Minyak Goreng 2L', 36000, 30),
        (4, 'Minyak Goreng 1L', 19000, 45),
        (5, 'Gula Pasir 1kg', 16000, 50),
        (6, 'Tepung Terigu 1kg', 13000, 40),
        (7, 'Telur Ayam 1kg', 28000, 25),
        (8, 'Garam Halus 500g', 6000, 60),
        (9, 'Kecap Manis 600ml', 22000, 30),
        (10, 'Saus Sambal 335ml', 12000, 35),
        (11, 'Mie Instan Goreng', 3500, 100),
        (12, 'Mie Instan Kuah', 3300, 90),
        (13, 'Kopi Bubuk 200g', 25000, 25),
        (14, 'Teh Celup 25 Kantong', 8500, 40),
        (15, 'Susu UHT 1L', 18000, 30),
        (16, 'Susu Kental Manis', 12000, 35),
        (17, 'Sabun Mandi Cair 450ml', 21000, 30),
        (18, 'Sampo 340ml', 28000, 25),
        (19, 'Pasta Gigi 190g', 15000, 30),
        (20, 'Sabun Cuci Piring 800ml', 17500, 35),
        (21, 'Deterjen Bubuk 800g', 24000, 30),
        (22, 'Pewangi Pakaian 1L', 20000, 25),
        (23, 'Tisu Gulung 250 Sheet', 11000, 40),
        (24, 'Air Mineral 600ml', 3500, 120),
        (25, 'Roti Tawar', 16000, 20),
        (26, 'Selai Kacang 340g', 23000, 20),
        (27, 'Biskuit Kelapa 300g', 14000, 30),
        (28, 'Keripik Kentang 68g', 11000, 40),
        (29, 'Minuman Teh Botol 350ml', 5000, 60),
        (30, 'Kopi Susu Gula Aren', 22000, 25)
)
INSERT INTO products (tenant_id, name, price, stock)
SELECT t.id, c.product_name, c.price, c.stock
FROM store_plan s
JOIN tenants t ON t.email = s.email
JOIN catalog c ON c.ord <= s.total
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE p.tenant_id = t.id AND p.name = c.product_name
);
