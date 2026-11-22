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

## Menjalankan dengan Docker

```bash
cp .env.example .env
# opsional: ganti JWT_SECRET
docker compose up -d --build
```

Akses aplikasi di `http://localhost:3000`. Container yang berjalan:

- `flexshop-app` — aplikasi Next.js (port 3000)
- `flexshop-db` — PostgreSQL 15 (port internal 5432)

Skema tabel dan data dummy dibuat otomatis dari `database/init.sql` saat volume database masih kosong.

### Akun dummy

| Toko | Email | Password | Paket | Produk |
| --- | --- | --- | --- | --- |
| Toko Dummy 1 | `toko1@gmail.com` | `admin123` | PRO | 15 |
| Toko Dummy 2 | `toko2@gmail.com` | `admin123` | PRO | 18 |
| Toko Dummy 3 | `toko3@gmail.com` | `admin123` | PRO | 21 |
| Toko Dummy 4 | `toko4@gmail.com` | `admin123` | PRO | 25 |
| Toko Dummy 5 | `toko5@gmail.com` | `admin123` | PRO | 30 |

Semua akun memakai paket PRO agar bisa menampung 15–30 produk. Anda juga tetap bisa mendaftarkan toko baru lewat halaman registrasi.

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
- `npm run dev` hanya untuk pengembangan. Untuk demo/UAS gunakan mode produksi (Docker image), sesuai kebutuhan non-fungsional PRD.
- Tanpa Docker sama sekali: siapkan PostgreSQL lokal, buat database `flexshop`, jalankan `database/init.sql`, lalu isi `DATABASE_URL` di `.env.local`.

Perintah lain: `npm run lint`, `npm run typecheck`, `npm run build`, `npm start`.

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
  (app)/                 # layout + halaman terproteksi (dashboard, products, transactions)
  api/                   # route handler auth, products, transactions, health
  login/                 # halaman login & registrasi
  globals.css            # token desain, dark variant, animasi
components/              # UI primitives, shell, form, tabel, toast
lib/                     # db, jwt, auth, queries, format, validasi
database/init.sql        # skema + seeder multi-tenant
proxy.ts                 # redirect berbasis sesi (pengganti middleware Next 16)
Dockerfile               # multi-stage build standalone
docker-compose.yml       # flexshop-app + flexshop-db
```

## Deploy ke server (CT 101) tanpa scp

Ada dua cara tanpa scp. Untuk CT 101 (1 vCPU / 1 GB), **Opsi 1 lebih aman**: server hanya menarik image jadi dan tidak melakukan build berat.

### Persiapan server (sekali saja)

1. Pastikan LXC punya `nesting=1` (Docker membutuhkan ini). Di host Proxmox:
   ```bash
   pct set 101 -features nesting=1
   pct reboot 101
   ```
2. Install Docker + Compose plugin di CT 101 (Debian 12):
   ```bash
   apt update && apt install -y curl
   curl -fsSL https://get.docker.com | sh
   systemctl enable --now docker
   docker run --rm hello-world
   ```
3. Pastikan port 3000 tidak dipakai aplikasi lama (STEGO-AE):
   ```bash
   ss -ltnp | grep :3000
   ```
   Hentikan service lama jika ada, misalnya `systemctl stop <nama-service>`.
4. Cek resource:
   ```bash
   free -m
   df -h
   ```

### Opsi 1 — Docker Hub + `docker pull` (disarankan, tanpa scp)

Di lokal:
```bash
# ganti <dockerhub-user> dengan username Docker Hub Anda
docker login
docker tag flexshop-app:latest <dockerhub-user>/flexshop-app:latest
docker push <dockerhub-user>/flexshop-app:latest
```

Di server (clone repo untuk mengambil `docker-compose.server.yml` dan `database/init.sql`):
```bash
cd /root
git clone https://github.com/<username>/<repo>.git flexshop
cd flexshop

cp .env.example .env
nano .env
# isi:
#   POSTGRES_PASSWORD=<openssl rand -hex 24>
#   JWT_SECRET=<openssl rand -base64 32>
#   APP_IMAGE=<dockerhub-user>/flexshop-app:latest

docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
docker compose -f docker-compose.server.yml ps
curl http://localhost:3000/api/health
```

Update aplikasi nanti:
```bash
# lokal
docker compose build app
docker tag flexshop-app:latest <dockerhub-user>/flexshop-app:latest
docker push <dockerhub-user>/flexshop-app:latest

# server
cd /root/flexshop && git pull
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

### Opsi 2 — Git clone lalu build di server (tanpa scp, tanpa registry)

Di lokal:
```bash
git add .
git commit -m "FlexShop multi-tenant"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

Di server:
```bash
cd /root
git clone https://github.com/<username>/<repo>.git flexshop
cd flexshop
cp .env.example .env
nano .env   # isi POSTGRES_PASSWORD dan JWT_SECRET
docker compose up -d --build
```

Peringatan: build Next.js di CT 101 (1 vCPU / 1 GB) bisa lambat dan berisiko OOM. Pastikan swap aktif (`swapon --show`) atau gunakan Opsi 1.

### Opsi 3 — Registry + GitHub Actions (opsional, otomatis)

Setiap `git push` ke GitHub, Actions membangun image lalu push ke GHCR/Docker Hub. Server cukup `docker compose -f docker-compose.server.yml pull && up -d`. Butuh workflow dan secret registry.

### Opsi 4 — Transfer image via scp (cadangan)

```bash
# lokal
docker save flexshop-app:latest | gzip > flexshop-app.tar.gz
scp flexshop-app.tar.gz root@192.168.122.101:/root/
scp docker-compose.yml root@192.168.122.101:/root/flexshop/
scp -r database root@192.168.122.101:/root/flexshop/

# server
cd /root/flexshop
docker load -i /root/flexshop-app.tar.gz
docker compose up -d --no-build
```

Catatan arsitektur: image lokal dan server harus sama-sama `linux/amd64`. Jika berbeda, build dengan `docker build --platform linux/amd64 -t flexshop-app:latest .`.

### File yang wajib ada di server

- `docker-compose.server.yml` (deploy dari registry) atau `docker-compose.yml` (build di server/scp)
- `database/init.sql` (inisialisasi DB saat volume baru)
- `.env` (JWT_SECRET, POSTGRES_*, APP_IMAGE)
- Image `flexshop-app` di registry/daftar image Docker server

### Cloudflare Tunnel

Di host Proxmox tempat `cloudflared` berjalan, tambahkan route:

```text
flexshop.shiend.my.id  →  http://192.168.122.101:3000
```

Port 3000 tidak perlu dibuka ke internet; tunnel bersifat outbound.

## Deployment (CT 101)

- Aplikasi berjalan pada container `flexshop-app` di CT 101 (`192.168.122.101`), port 3000.
- Route Cloudflare Tunnel: `flexshop.shiend.my.id` → `http://192.168.122.101:3000`.
- Container dikelola melalui Portainer CE dan metrik host dipantau Prometheus + Grafana di CT 100.
- Batas heap Node di compose diset `--max-old-space-size=512` agar aman pada RAM 1 GB.
