# FlexShop — Sistem Pencatatan Toko Multi-Tenant (SaaS)

FlexShop adalah aplikasi pencatatan toko dan inventaris berbasis **multi-tenant SaaS** untuk UAS Komputasi Awan. Satu instance aplikasi dan satu database dipakai bersama oleh banyak toko, dengan isolasi data ketat melalui `tenant_id` pada setiap query.

## Fitur

- Registrasi & login toko (JWT HttpOnly Cookie + bcrypt).
- Dashboard ringkasan: total produk, transaksi, pendapatan, item terjual, dan kuota paket.
- CRUD produk dengan pembatasan kuota paket (`FREE` maks. 10 produk, `PRO` tanpa batas).
- Pencatatan transaksi penjualan: stok otomatis berkurang dan riwayat tersimpan.
- Isolasi data antar-tenant (row-level `tenant_id`).
- Endpoint `/api/health` dan `/api/products` untuk monitoring dan uji beban Apache JMeter.
- UI dark-mode default, tema warm-stone, glass panel, dan tipografi Inter + JetBrains Mono.

## Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| Runtime | Node.js 20 |
| Framework | Next.js 16 (App Router, Cache Components, standalone) |
| Database | PostgreSQL 15 Alpine |
| DB Client | `pg` (raw SQL parameterized) |
| Auth | `jose` (JWT) + `bcryptjs` |
| Styling | Tailwind CSS v4 |
| Container | Docker & Docker Compose |

## Menjalankan (pull image — cara normal)

Cara normal menjalankan FlexShop adalah menarik image yang sudah dipublikasikan. Tidak perlu build di server.

Prasyarat: Docker Engine + Docker Compose plugin.

1. Siapkan environment:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   POSTGRES_USER=flexshop
   POSTGRES_PASSWORD=<openssl rand -hex 24>
   POSTGRES_DB=flexshop
   JWT_SECRET=<openssl rand -base64 32>
   APP_IMAGE=<dockerhub-user>/flexshop-app:latest
   DB_IMAGE=<dockerhub-user>/flexshop-db:latest
   ```

2. Pull dan jalankan:

   ```bash
   docker compose -f docker-compose.pull.yml pull
   docker compose -f docker-compose.pull.yml up -d
   ```

3. Cek:

   ```bash
   docker compose -f docker-compose.pull.yml ps
   curl http://localhost:3000/api/health
   ```

   Buka `http://localhost:3000`. Container yang berjalan:

   - `flexshop-app` — aplikasi Next.js (port 3000)
   - `flexshop-db` — PostgreSQL 15

`init.sql` sudah dibungkus di image DB dan hanya dijalankan saat volume `flexshop_pgdata` pertama kali dibuat.

### Akun dummy

| Toko | Email | Password | Paket | Produk |
| --- | --- | --- | --- | --- |
| Toko Dummy 1 | `toko1@gmail.com` | `admin123` | PRO | 15 |
| Toko Dummy 2 | `toko2@gmail.com` | `admin123` | PRO | 18 |
| Toko Dummy 3 | `toko3@gmail.com` | `admin123` | PRO | 21 |
| Toko Dummy 4 | `toko4@gmail.com` | `admin123` | PRO | 25 |
| Toko Dummy 5 | `toko5@gmail.com` | `admin123` | PRO | 30 |

Semua akun memakai paket PRO agar bisa menampung 15–30 produk. Anda juga tetap bisa mendaftarkan toko baru lewat halaman registrasi.

### Update dan reset

```bash
# update ke image terbaru
docker compose -f docker-compose.pull.yml pull
docker compose -f docker-compose.pull.yml up -d

# reset total (hapus semua data)
docker compose -f docker-compose.pull.yml down -v
```

## Deploy ke server (CT 101)

### Persiapan server (sekali saja)

1. Pastikan LXC punya `nesting=1` dan `keyctl=1` (Docker membutuhkan ini). Di host Proxmox:

   ```bash
   pct set 101 -features nesting=1,keyctl=1
   pct reboot 101
   ```

2. Install Docker + Compose plugin di CT 101 (Debian 12):

   ```bash
   apt update && apt install -y curl
   curl -fsSL https://get.docker.com | sh
   systemctl enable --now docker
   docker run --rm hello-world
   ```

3. Pastikan port 3000 tidak dipakai aplikasi lama:

   ```bash
   ss -ltnp | grep :3000
   ```

   Hentikan service lama jika ada, misalnya `systemctl stop <nama-service>`.

### Cara utama — Portainer (pull-only)

1. Daftarkan Docker CT 101 sebagai environment di Portainer CE (Portainer Agent di `192.168.122.101:9001`).
2. **Stacks → Add stack**, nama `flexshop`.
3. Pilih **Web editor**, tempel isi `docker-compose.pull.yml`.
4. Isi environment variables:

   ```env
   APP_IMAGE=<dockerhub-user>/flexshop-app:latest
   DB_IMAGE=<dockerhub-user>/flexshop-db:latest
   POSTGRES_PASSWORD=<openssl rand -hex 24>
   JWT_SECRET=<openssl rand -base64 32>
   ```

5. **Deploy the stack**.

Kalau image disimpan di repo private, tambahkan kredensial registry di Portainer: **Registries → Add registry**.

### Alternatif — SSH tanpa clone

```bash
mkdir -p /opt/flexshop && cd /opt/flexshop
curl -O https://raw.githubusercontent.com/shiend-d/flexshop/main/docker-compose.pull.yml

cat > .env <<'EOF'
POSTGRES_USER=flexshop
POSTGRES_PASSWORD=<isi-password-hex>
POSTGRES_DB=flexshop
JWT_SECRET=<isi-secret-acak>
APP_IMAGE=<dockerhub-user>/flexshop-app:latest
DB_IMAGE=<dockerhub-user>/flexshop-db:latest
EOF

docker compose -f docker-compose.pull.yml pull
docker compose -f docker-compose.pull.yml up -d
```

### Cloudflare Tunnel

Di host Proxmox tempat `cloudflared` berjalan, tambahkan route:

```text
flexshop.shiend.my.id  →  http://192.168.122.101:3000
```

Port 3000 tidak perlu dibuka ke internet; tunnel bersifat outbound.

## Dev lokal (`npm run dev`)

Cara paling praktis: jalankan container database saja, lalu Next.js di host.

```bash
docker compose up -d db
```

Buat `.env.local`:

```bash
DATABASE_URL=postgres://flexshop:flexshop@localhost:5433/flexshop
JWT_SECRET=string-acak-panjang
```

Port host `5433` dipakai agar tidak bentrok dengan PostgreSQL lokal yang mungkin sudah berjalan di `5432`.

Lalu:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Di mode dev cookie tidak memakai flag `Secure`, jadi login lewat HTTP tetap jalan.

Catatan:

- `database/init.sql` otomatis dijalankan saat volume DB pertama kali dibuat. Untuk reset data: `docker compose down -v && docker compose up -d db`.
- Saat `npm run dev`, jangan jalankan container `app` (keduanya memakai port 3000). Cukup service `db`.
- `npm run dev` hanya untuk pengembangan. Untuk demo/UAS gunakan image produksi lewat `docker-compose.pull.yml`.
- Tanpa Docker sama sekali: siapkan PostgreSQL lokal, buat database `flexshop`, jalankan `database/init.sql`, lalu isi `DATABASE_URL` di `.env.local`.

Perintah lain: `npm run lint`, `npm run typecheck`, `npm run build`, `npm start`.

## Untuk maintainer — build & push image

Jalankan dari root repo:

```bash
docker build -t <dockerhub-user>/flexshop-app:latest .
docker build -t <dockerhub-user>/flexshop-db:latest ./database

docker login
docker push <dockerhub-user>/flexshop-app:latest
docker push <dockerhub-user>/flexshop-db:latest
```

- `docker-compose.pull.yml` — **cara normal deploy** (app image + DB image).
- `docker-compose.yml` — build lokal/dev (app dibangun dari `Dockerfile`, DB memakai `init.sql`).
- `docker-compose.server.yml` — alternatif registry lama yang masih membutuhkan folder `database/`.

Setelah push image baru, server cukup:

```bash
docker compose -f docker-compose.pull.yml pull
docker compose -f docker-compose.pull.yml up -d
```

Catatan arsitektur: image lokal dan server harus sama-sama `linux/amd64`. Jika berbeda, build dengan `docker build --platform linux/amd64 -t <dockerhub-user>/flexshop-app:latest .`.

## API

| Method | Endpoint | Auth | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Daftar toko baru (`store_name`, `email`, `password`) |
| POST | `/api/auth/login` | – | Login (`email`, `password`) |
| POST | `/api/auth/logout` | Sesi | Hapus cookie sesi |
| GET | `/api/auth/me` | Sesi | Info tenant aktif |
| GET | `/api/products` | Sesi | Daftar produk tenant |
| POST | `/api/products` | Sesi | Tambah produk (`name`, `price`, `stock`) + cek kuota |
| PATCH | `/api/products/[id]` | Sesi | Ubah produk milik tenant |
| DELETE | `/api/products/[id]` | Sesi | Hapus produk (409 jika punya transaksi) |
| GET | `/api/transactions` | Sesi | Riwayat transaksi tenant |
| POST | `/api/transactions` | Sesi | Catat penjualan (`product_id`, `quantity`) |
| GET | `/api/health` | – | Health check publik |

Semua query produk/transaksi memakai filter `tenant_id` dari sesi, bukan dari input client.

## Pengujian dengan Apache JMeter

1. Buat HTTP Request `POST /api/auth/login` dengan akun dummy (mis. `toko1@gmail.com` / `admin123`) dan **HTTP Cookie Manager** agar cookie sesi tersimpan.
2. Tambahkan `GET /api/products` (butuh sesi) dan/atau `GET /api/health` (tanpa sesi).
3. Skenario yang disarankan: 200, 400, 600, 800, 1000 virtual users; ramp-up 60 detik; loop 10.
4. Pantau CPU/RAM container melalui Portainer/Grafana saat pengujian berlangsung.

Contoh cepat via curl:

```bash
curl -s http://localhost:3000/api/health
curl -s -c cookie.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"toko1@gmail.com","password":"admin123"}'
curl -s -b cookie.txt http://localhost:3000/api/products
```

## Struktur Proyek

```text
app/
  (app)/                    # layout + halaman terproteksi (dashboard, products, transactions)
  api/                      # route handler auth, products, transactions, health
  login/                    # halaman login & registrasi
  globals.css               # token desain, dark variant, animasi
components/                 # UI primitives, shell, form, tabel, toast
lib/                        # db, jwt, auth, queries, format, validasi
database/
  init.sql                  # skema + data dummy
  Dockerfile                # postgres + init.sql (image DB)
proxy.ts                    # redirect berbasis sesi (pengganti middleware Next 16)
Dockerfile                  # multi-stage build aplikasi (standalone)
docker-compose.pull.yml     # deploy normal: pull app + DB image
docker-compose.yml          # build/dev lokal
docker-compose.server.yml   # alternatif registry lama (butuh folder database/)
```

## Catatan

- Akun dummy memakai password `admin123`; ganti/hapus untuk penggunaan nyata.
- `init.sql` hanya berjalan saat volume DB pertama kali dibuat. Untuk reset: `down -v`.
- Jangan commit `.env`; simpan `JWT_SECRET` dan `POSTGRES_PASSWORD` hanya di server.
- Container dikelola melalui Portainer CE; metrik host dipantau Prometheus + Grafana di CT 100.
