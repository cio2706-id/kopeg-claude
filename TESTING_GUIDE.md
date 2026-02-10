# KopegBKI - Complete Testing Guide

Panduan lengkap untuk menguji semua fitur dan fungsi aplikasi Koperasi Pegawai PT BKI.

---

## PREREQUISITES (Sebelum Testing)

### 1. Run Migration SQL

Buka **Supabase SQL Editor** dan jalankan file berikut secara berurutan:

**File: `scripts/migration-loan-balances.sql`**
```sql
-- Copy-paste seluruh isi file dan jalankan di Supabase SQL Editor
-- Ini akan membuat 3 tabel baru: loan_balances, monthly_deductions, upload_logs
```

### 2. Verify Environment Variables

Pastikan `.env.local` berisi:
```
NEXT_PUBLIC_SUPABASE_URL=https://ksjiyjvzayoazkcuwqrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ACCURATE_CLIENT_ID=<your-client-id>
ACCURATE_CLIENT_SECRET=<your-client-secret>
ACCURATE_ACCESS_TOKEN=<your-access-token>
```

### 3. Create Test Users in Supabase Auth

Buka **Supabase Dashboard > Authentication > Users** dan buat akun-akun berikut:

| Email | Password | Keterangan |
|-------|----------|------------|
| `member1@bki.co.id` | `test1234` | Anggota biasa |
| `member2@bki.co.id` | `test1234` | Anggota biasa (untuk test kedua) |
| `treasury@bki.co.id` | `test1234` | Staf Treasury |
| `pengadaan@bki.co.id` | `test1234` | Staf Pengadaan |
| `manager@bki.co.id` | `test1234` | Manager |
| `bendahara@bki.co.id` | `test1234` | Bendahara |
| `ketua@bki.co.id` | `test1234` | Ketua |

### 4. Set User Roles in Database

Setelah semua user login pertama kali (agar auto-create DB record), update role mereka di Supabase SQL Editor:

```sql
-- Check existing users first
SELECT id, email, role FROM users;

-- Update roles
UPDATE users SET role = 'staf_treasury' WHERE email = 'treasury@bki.co.id';
UPDATE users SET role = 'staf_pengadaan' WHERE email = 'pengadaan@bki.co.id';
UPDATE users SET role = 'manager' WHERE email = 'manager@bki.co.id';
UPDATE users SET role = 'bendahara' WHERE email = 'bendahara@bki.co.id';
UPDATE users SET role = 'ketua' WHERE email = 'ketua@bki.co.id';
```

### 5. Start the App

```bash
npm run dev
```

Buka `http://localhost:3000`

---

## TEST PLAN

## PHASE 1: PUBLIC PAGES (No Login Required)

### Test 1.1: Homepage
- [ ] Buka `http://localhost:3000`
- [ ] Verify hero section tampil dengan judul "Koperasi Pegawai PT BKI"
- [ ] Verify ada tombol "Ajukan PO" dan "Lacak PO" di hero
- [ ] Verify navbar ada link: Beranda, Ajukan PO, Lacak PO, Login Anggota, Login Pengurus
- [ ] Klik "Ajukan PO" → harus ke `/po/request`
- [ ] Klik "Lacak PO" → harus ke `/po/track`
- [ ] Klik "Login Anggota" → harus ke `/member/login`
- [ ] Klik "Login Pengurus" → harus ke `/pengurus/login`

### Test 1.2: PO Request (Public - Tanpa Login)
- [ ] Buka `http://localhost:3000/po/request`
- [ ] Isi form:
  - Nama Pemohon: "Test User"
  - Divisi: "IT"
  - NIP: "12345"
  - Deskripsi: "Pembelian laptop untuk divisi IT"
  - Tambah item: "Laptop Lenovo", qty: 2, unit: "unit", harga: 15000000
  - Tambah item kedua: "Mouse wireless", qty: 5, unit: "pcs", harga: 250000
- [ ] Verify total otomatis terhitung (Rp 31.250.000)
- [ ] (Optional) Upload PDF document
- [ ] Klik "Ajukan PO"
- [ ] Verify halaman sukses tampil dengan PO Number dan Tracking Number
- [ ] **CATAT tracking number** untuk test 1.3
- [ ] Verify tombol "Kembali ke Beranda" mengarah ke `/`

### Test 1.3: PO Tracking (Public)
- [ ] Buka `http://localhost:3000/po/track`
- [ ] Masukkan tracking number dari Test 1.2
- [ ] Klik "Lacak"
- [ ] Verify detail PO tampil:
  - Deskripsi benar
  - Status "Diajukan"
  - Timeline tampil dengan step-step approval
  - Tabel approval menunjukkan langkah yang pending

---

## PHASE 2: MEMBER FEATURES

### Test 2.1: Member Login
- [ ] Buka `http://localhost:3000/member/login`
- [ ] Login dengan `member1@bki.co.id` / `test1234`
- [ ] Verify redirect ke `/member/dashboard`
- [ ] Verify sidebar tampil dengan menu: Dashboard, Simpanan, Pinjaman, Ajukan Pinjaman, Settings

### Test 2.2: Member Dashboard
- [ ] Verify halaman dashboard tampil
- [ ] Summary cards visible: Simpanan, Pinjaman Reguler, Pinjaman Khusus, Pinjaman Barang, Pinjaman Travel
- [ ] Semua value awal = Rp 0 (belum ada data)
- [ ] Statistik Pinjaman gauges tampil
- [ ] Transaksi Terbaru section kosong (belum ada)

### Test 2.3: Simpanan Page
- [ ] Klik "Simpanan" di sidebar
- [ ] Verify halaman `/member/savings` tampil
- [ ] Summary cards: Simpanan Pokok, Wajib, Sukarela, Total
- [ ] Tabel histori kosong (belum ada data)

### Test 2.4: Loan Application
- [ ] Klik "Ajukan Pinjaman" di sidebar → `/member/loan-application`
- [ ] Pilih jenis pinjaman: "Reguler (12% p.a.)"
- [ ] Masukkan jumlah: 10000000 (10 juta)
- [ ] Pilih tenor: 12 bulan
- [ ] Verify kalkulasi otomatis:
  - Bunga per bulan: ~Rp 100.000
  - Cicilan per bulan: ~Rp 933.333
  - Total pembayaran: ~Rp 11.200.000
- [ ] Isi tujuan: "Biaya renovasi rumah"
- [ ] (Optional) Upload dokumen PDF
- [ ] Klik "Ajukan Pinjaman"
- [ ] Verify halaman sukses tampil dengan tracking number
- [ ] **CATAT tracking number** untuk approval test
- [ ] Verify tombol "Kembali ke Dashboard" mengarah ke `/member/dashboard`

### Test 2.5: Loans Page
- [ ] Klik "Pinjaman" di sidebar → `/member/loans`
- [ ] Verify pinjaman yang baru diajukan tampil di tabel
- [ ] Verify status menunjukkan "Menunggu Treasury" atau "Pending Treasury"
- [ ] Verify detail: jenis, jumlah, tenor, cicilan sesuai

### Test 2.6: Payment Tracker
- [ ] Buka `/payment-tracker`
- [ ] Verify halaman pencarian tampil
- [ ] Masukkan tracking number pinjaman dari Test 2.4
- [ ] Verify detail dan status pinjaman tampil

### Test 2.7: Member Settings
- [ ] Klik "Settings" di sidebar → `/member/settings`
- [ ] Verify profil info tampil (email, nama)
- [ ] Verify opsi notifikasi tampil

---

## PHASE 3: PENGURUS FEATURES - APPROVAL WORKFLOW

### Test 3.1: Pengurus Login (Treasury)
- [ ] Buka `http://localhost:3000/pengurus/login`
- [ ] Login dengan `treasury@bki.co.id` / `test1234`
- [ ] Verify redirect ke `/pengurus/dashboard`

### Test 3.2: Pengurus Dashboard Overview
- [ ] Verify summary cards tampil: Total Anggota, Pinjaman Pending, PO Pending, Total Pinjaman, Pencairan Bulan Ini
- [ ] Verify "Menunggu Persetujuan" section menunjukkan pinjaman dari member1
- [ ] Verify grafik tren pinjaman tampil
- [ ] Verify aktivitas terbaru tampil

### Test 3.3: Approve Loan - Step 1 (Treasury)
- [ ] Di dashboard, cari pinjaman member1 di "Menunggu Persetujuan"
- [ ] Verify tombol "Setujui" dan "Tolak" tampil (karena role = staf_treasury)
- [ ] Klik "Setujui"
- [ ] Verify muncul form credit analysis (optional):
  - Credit Score: 85
  - Catatan: "Analisis kredit OK"
- [ ] Submit approval
- [ ] Verify pinjaman berpindah ke step berikutnya (Manager)
- [ ] Verify tombol tidak lagi tampil (bukan giliran treasury)
- [ ] Menunjukkan "Menunggu tindakan dari Manager"

### Test 3.4: Approve Loan - Step 2 (Manager)
- [ ] Logout treasury
- [ ] Login sebagai `manager@bki.co.id`
- [ ] Buka `/pengurus/dashboard`
- [ ] Verify pinjaman tampil di "Menunggu Persetujuan" dengan tombol aksi
- [ ] Klik "Setujui"
- [ ] Verify status berubah ke "Menunggu tindakan dari Bendahara"

### Test 3.5: Approve Loan - Step 3 (Bendahara)
- [ ] Logout manager
- [ ] Login sebagai `bendahara@bki.co.id`
- [ ] Buka `/pengurus/dashboard`
- [ ] Approve pinjaman
- [ ] Verify status berubah ke "Menunggu tindakan dari Ketua"

### Test 3.6: Approve Loan - Step 4 (Ketua - Final)
- [ ] Logout bendahara
- [ ] Login sebagai `ketua@bki.co.id`
- [ ] Buka `/pengurus/dashboard`
- [ ] Approve pinjaman (final approval)
- [ ] Verify status pinjaman berubah ke "Approved" / "SPP Process"
- [ ] (Jika Accurate API aktif) Verify journal voucher tercipta di Accurate

### Test 3.7: Verify Approved Loan di Member Dashboard
- [ ] Login sebagai `member1@bki.co.id` di `/member/login`
- [ ] Buka `/member/loans`
- [ ] Verify pinjaman menunjukkan status "Approved" atau "SPP Process"

### Test 3.8: Approve PO (from Test 1.2)
- [ ] Login sebagai `pengadaan@bki.co.id` (staf_pengadaan)
- [ ] Buka `/pengurus/dashboard`
- [ ] Cari PO dari Test 1.2 di "Menunggu Persetujuan"
- [ ] Approve PO (Step 1: Staf Pengadaan)
- [ ] Logout, login sebagai `manager@bki.co.id`
- [ ] Approve PO (Step 2: Manager - Final)
- [ ] Track PO di `/po/track` → verify status berubah ke "Approved RAB"

### Test 3.9: Reject Test
- [ ] Login sebagai `member1@bki.co.id`
- [ ] Ajukan pinjaman baru (jumlah: 5000000, reguler, 6 bulan)
- [ ] Login sebagai `treasury@bki.co.id`
- [ ] Klik "Tolak" pada pinjaman baru
- [ ] Isi alasan: "Tidak memenuhi syarat"
- [ ] Verify pinjaman ditolak
- [ ] Login sebagai `member1@bki.co.id`
- [ ] Verify di `/member/loans` pinjaman berstatus "Ditolak"

---

## PHASE 4: PENGURUS DATA MANAGEMENT

### Test 4.1: Navigate to Data Management
- [ ] Login sebagai salah satu pengurus (manager, bendahara, dll)
- [ ] Verify "Data Management" tampil di sidebar dengan icon Upload
- [ ] Klik → buka `/pengurus/data-management`
- [ ] Verify 3 tab tampil: Upload Saldo Simpanan, Upload Saldo Pinjaman, Upload Potongan Bulanan

### Test 4.2: Upload Simpanan Saldo
- [ ] Klik tab "Upload Saldo Simpanan"
- [ ] Pilih file: `simpanan anggota/Data base simpanan des 2025.xlsx`
- [ ] Set periode: `2025-12`
- [ ] Klik Upload
- [ ] Verify hasil upload:
  - Jumlah record yang diproses (processed)
  - Jumlah yang di-skip (jika ada member tidak ditemukan)
  - Total amount
  - Error details (jika ada)
- [ ] Verify tabel Upload History di bawah menunjukkan log baru

### Test 4.3: Upload Pinjaman Saldo - Channeling
- [ ] Klik tab "Upload Saldo Pinjaman"
- [ ] Pilih jenis pinjaman: "Channeling"
- [ ] Pilih file: `Pinjaman Anggota/1. KERTAS KERJA - PIUTANG CHANNELING...xlsx`
- [ ] Set periode: `2025-12`
- [ ] Klik Upload
- [ ] Verify hasil: processed records, total amount
- [ ] Verify Upload History updated

### Test 4.4: Upload Pinjaman Saldo - Khusus
- [ ] Masih di tab "Upload Saldo Pinjaman"
- [ ] Pilih jenis: "Khusus"
- [ ] Pilih file: `Pinjaman Anggota/3A. KERTAS KERJA PIUTANG KHUSUS...xlsx`
- [ ] Periode: `2025-12`
- [ ] Upload dan verify

### Test 4.5: Upload Pinjaman Saldo - Reguler
- [ ] Jenis: "Reguler"
- [ ] File: `Pinjaman Anggota/3C. KERTAS KERJA PIUTANG REGULER...xlsx`
- [ ] Periode: `2025-12`
- [ ] Upload dan verify

### Test 4.6: Upload Pinjaman Saldo - Barang
- [ ] Jenis: "Barang"
- [ ] File: `Pinjaman Anggota/3D. KERTAS KERJA PIUTANG PINJAMAN BARANG...xlsx`
- [ ] Periode: `2025-12`
- [ ] Upload dan verify

### Test 4.7: Upload Potongan Bulanan - BKI Pegawai Tetap
- [ ] Klik tab "Upload Potongan Bulanan"
- [ ] Pilih sumber: "BKI Pegawai Tetap"
- [ ] Pilih file: `Pinjaman Anggota/update montly/01. JANUARI 2026 - POTONGAN BKI PEGAWAI TETAP.xlsx`
- [ ] Periode: `2026-01`
- [ ] Upload dan verify
- [ ] Verify: simpanan anggota bertambah, pinjaman berkurang

### Test 4.8: Upload Potongan - IDS
- [ ] Sumber: "IDS"
- [ ] File: `...01. JANUARI 2026 - POTONGAN IDS.xlsx`
- [ ] Periode: `2026-01`
- [ ] Upload dan verify

### Test 4.9: Upload Potongan - Kontrak Proyek MNS
- [ ] Sumber: "Kontrak Proyek MNS"
- [ ] File: `...01. JANUARI 2026 - KONTRAK PROYEK MNS.xlsx`
- [ ] Periode: `2026-01`
- [ ] Upload dan verify

### Test 4.10: Upload Potongan - SBU Industri Kontrak
- [ ] Sumber: "SBU Industri Kontrak"
- [ ] File: `...01. JANUARI 2026 - SBU INDUSTRI KONTRAK.xlsx`
- [ ] Periode: `2026-01`
- [ ] Upload dan verify

### Test 4.11: Upload Potongan - SBU Energi Kontrak
- [ ] Sumber: "SBU Energi Kontrak"
- [ ] File: `...01. JANUARI 2026 - SBU ENERGI KONTRAK.xlsx`
- [ ] Periode: `2026-01`
- [ ] Upload dan verify

### Test 4.12: Verify Upload History
- [ ] Scroll ke bagian "Riwayat Upload" di bawah
- [ ] Verify semua upload yang berhasil tercatat
- [ ] Verify informasi: tipe, periode, file name, jumlah record, total amount, tanggal

---

## PHASE 5: VERIFY IMPORTED DATA ON MEMBER DASHBOARD

### Test 5.1: Member Dashboard - Simpanan Breakdown
- [ ] Login sebagai member yang ada di file Excel (harus cocok email/nama/NUP)
- [ ] Buka `/member/dashboard`
- [ ] Verify "Rincian Simpanan" section tampil (di bawah summary cards)
- [ ] Verify breakdown: Wajib, Pokok, Khusus, Sukarela, SHU, Total
- [ ] Verify nilai sesuai dengan file Excel yang diupload
- [ ] Verify periode tertulis "2025-12" (atau sesuai upload)

### Test 5.2: Member Dashboard - Pinjaman Balances
- [ ] Verify summary cards menunjukkan saldo pinjaman per jenis:
  - Pinjaman Reguler
  - Pinjaman Khusus
  - Pinjaman Barang
  - Channeling Mandiri (jika ada saldo)
  - Channeling BSI (jika ada saldo)
- [ ] Verify gauge statistics menunjukkan utilisasi per jenis
- [ ] Verify pinjaman cards di kiri menunjukkan saldo yang benar

### Test 5.3: Member Savings Page After Import
- [ ] Buka `/member/savings`
- [ ] Verify data simpanan dari Excel tampil di tabel histori
- [ ] Verify summary cards terupdate dengan saldo terbaru

### Test 5.4: After Potongan Upload
- [ ] Verify setelah potongan di-upload:
  - Saldo simpanan bertambah (dari kolom simpanan di potongan)
  - Saldo pinjaman berkurang (dari kolom pinjaman di potongan)
- [ ] Cek di member dashboard untuk melihat perubahan

---

## PHASE 6: PENGURUS MEMBER MANAGEMENT

### Test 6.1: Members Page
- [ ] Login sebagai pengurus
- [ ] Buka `/pengurus/members`
- [ ] Verify daftar semua member tampil
- [ ] Verify informasi: nama, email, role, department, status

### Test 6.2: Update User Role
- [ ] Klik edit pada salah satu user
- [ ] Ubah role (misal member → staf_akunting)
- [ ] Save dan verify perubahan tersimpan
- [ ] Kembalikan role ke semula

### Test 6.3: Deactivate/Activate User
- [ ] Nonaktifkan salah satu test user
- [ ] Verify user menunjukkan status inactive
- [ ] Aktifkan kembali

---

## PHASE 7: PENGURUS OTHER PAGES

### Test 7.1: Pengurus Loans Page
- [ ] Buka `/pengurus/loans`
- [ ] Verify semua pinjaman tampil (dari semua anggota)
- [ ] Verify filter/search jika ada

### Test 7.2: Pengurus PO Page
- [ ] Buka `/pengurus/po`
- [ ] Verify semua PO tampil
- [ ] Verify detail PO bisa dibuka

### Test 7.3: Pengurus Approvals Page
- [ ] Buka `/pengurus/approvals`
- [ ] Verify daftar approval pending dan history tampil

### Test 7.4: Pengurus Reports Page
- [ ] Buka `/pengurus/reports`
- [ ] Verify grafik/charts tampil
- [ ] Verify data analytics sesuai

### Test 7.5: Pengurus Settings
- [ ] Buka `/pengurus/settings`
- [ ] Verify opsi pengaturan tampil

---

## PHASE 8: DOCUMENT UPLOAD

### Test 8.1: Upload Document on Loan Application
- [ ] Login sebagai member
- [ ] Buka `/member/loan-application`
- [ ] Isi form pinjaman
- [ ] Upload file PDF (max 5MB) di bagian "Upload Dokumen"
- [ ] Submit pinjaman
- [ ] Verify upload berhasil (no error)
- [ ] Note: Supabase Storage bucket "documents" akan otomatis dibuat pada upload pertama

### Test 8.2: Upload Document on PO Request
- [ ] Buka `/po/request`
- [ ] Isi form PO
- [ ] Upload PDF di bagian dokumen
- [ ] Submit PO
- [ ] Verify upload berhasil

---

## PHASE 9: EDGE CASES & ERROR HANDLING

### Test 9.1: Login with Wrong Credentials
- [ ] Buka `/member/login`
- [ ] Masukkan email yang salah → verify error message
- [ ] Masukkan password yang salah → verify error message

### Test 9.2: Access Protected Routes Without Login
- [ ] Buka `/member/dashboard` tanpa login → verify redirect ke `/member/login`
- [ ] Buka `/pengurus/dashboard` tanpa login → verify redirect ke `/pengurus/login`

### Test 9.3: PO Track with Invalid Number
- [ ] Buka `/po/track`
- [ ] Masukkan tracking number yang tidak ada: "INVALID-123"
- [ ] Verify pesan "tidak ditemukan" muncul

### Test 9.4: Upload Wrong File Type
- [ ] Di Data Management, coba upload file non-Excel (misal .txt)
- [ ] Verify error handling menunjukkan pesan yang jelas

### Test 9.5: Upload Empty/Invalid Excel
- [ ] Upload file Excel kosong atau format salah
- [ ] Verify error handling (0 records processed, error details)

### Test 9.6: Re-upload Same Period
- [ ] Upload simpanan saldo untuk periode yang sama (2025-12) dua kali
- [ ] Verify data di-upsert (tidak duplikat), record terbaru menimpa yang lama

### Test 9.7: Member Not Found in Excel
- [ ] Upload Excel yang berisi nama yang tidak ada di database
- [ ] Verify di hasil upload: record tersebut masuk ke "skipped" count
- [ ] Verify error details menunjukkan nama-nama yang tidak ditemukan

---

## PHASE 10: DATABASE VERIFICATION

Jalankan query berikut di Supabase SQL Editor untuk memverifikasi data:

### Check Users
```sql
SELECT id, email, full_name, role, employee_id, department, is_active
FROM users ORDER BY created_at;
```

### Check Savings After Import
```sql
SELECT u.email, u.full_name, s.period,
  s.simpanan_pokok, s.simpanan_wajib, s.simpanan_sukarela,
  s.simpanan_khusus, s.shu, s.total_balance
FROM savings s
JOIN users u ON u.id = s.user_id
ORDER BY s.period DESC, u.full_name
LIMIT 20;
```

### Check Loan Balances After Import
```sql
SELECT u.email, u.full_name, lb.loan_type, lb.period, lb.saldo
FROM loan_balances lb
JOIN users u ON u.id = lb.user_id
WHERE lb.saldo > 0
ORDER BY lb.period DESC, u.full_name
LIMIT 20;
```

### Check Monthly Deductions
```sql
SELECT u.email, u.full_name, md.period, md.source_file,
  md.simpanan_amount, md.pinjaman_amount
FROM monthly_deductions md
JOIN users u ON u.id = md.user_id
ORDER BY md.period DESC, u.full_name
LIMIT 20;
```

### Check Upload Logs
```sql
SELECT upload_type, period, file_name, sub_type,
  record_count, total_amount, created_at
FROM upload_logs
ORDER BY created_at DESC;
```

### Check Loans & Approvals
```sql
SELECT l.tracking_number, u.email, l.loan_type, l.amount, l.status,
  l.tenor_months, l.monthly_installment
FROM loans l
JOIN users u ON u.id = l.user_id
ORDER BY l.created_at DESC;
```

```sql
SELECT a.reference_type, a.reference_id, a.approver_role,
  a.step_label, a.action, a.comments, a.decided_at
FROM approvals a
ORDER BY a.created_at DESC
LIMIT 20;
```

### Check Purchase Orders
```sql
SELECT po.tracking_number, po.po_number, po.description,
  po.status, po.estimated_amount, po.total_amount,
  po.requester_name
FROM purchase_orders po
ORDER BY po.created_at DESC;
```

---

## QUICK CHECKLIST SUMMARY

| # | Feature | Test |
|---|---------|------|
| 1 | Homepage | Links, nav, hero |
| 2 | PO Request (public) | Form submit, tracking number |
| 3 | PO Track (public) | Search, status display |
| 4 | Member Login | Auth, redirect |
| 5 | Member Dashboard | Summary cards, charts |
| 6 | Simpanan Page | Savings display |
| 7 | Loan Application | Form, calculation, submit |
| 8 | Loans Page | List, status tracking |
| 9 | Approval: Treasury | Credit analysis, approve |
| 10 | Approval: Manager | Approve step 2 |
| 11 | Approval: Bendahara | Approve step 3 |
| 12 | Approval: Ketua | Final approve |
| 13 | Reject Loan | Rejection flow |
| 14 | PO Approval | Pengadaan → Manager |
| 15 | Upload Simpanan Saldo | Excel import |
| 16 | Upload Pinjaman Channeling | Excel import |
| 17 | Upload Pinjaman Khusus | Excel import |
| 18 | Upload Pinjaman Reguler | Excel import |
| 19 | Upload Pinjaman Barang | Excel import |
| 20 | Upload Potongan BKI | Monthly deduction |
| 21 | Upload Potongan IDS | Monthly deduction |
| 22 | Upload Potongan MNS | Monthly deduction |
| 23 | Upload Potongan SBU Industri | Monthly deduction |
| 24 | Upload Potongan SBU Energi | Monthly deduction |
| 25 | Verify Imported Simpanan | Member dashboard |
| 26 | Verify Imported Pinjaman | Member dashboard |
| 27 | Member Management | List, edit role |
| 28 | Document Upload | PDF on loan & PO |
| 29 | Error Handling | Invalid inputs |
| 30 | DB Verification | SQL queries |

---

## TESTING ORDER (Recommended)

1. **Run migration SQL** first
2. **Start app** (`npm run dev`)
3. **Create test users** in Supabase Auth
4. **Login each user once** (member login + pengurus login) to auto-create DB records
5. **Update roles** via SQL
6. **Test public pages** (1.1 - 1.3)
7. **Test member features** (2.1 - 2.7)
8. **Test approval workflow** (3.1 - 3.9) - this is the most important flow
9. **Test data management uploads** (4.1 - 4.12)
10. **Verify imported data** on member dashboard (5.1 - 5.4)
11. **Test edge cases** (9.1 - 9.7)
12. **Verify database** with SQL queries (Phase 10)

---

## TROUBLESHOOTING

### "User not found" after login
- The app auto-creates DB users on first API call. Make sure you visit the dashboard after login.

### Upload shows 0 records processed
- Check that members in the Excel file match DB users by employee ID (NUP/NO.ANGGOTA) or name.
- Names must match closely (case-insensitive LIKE search is used).
- Run `SELECT id, full_name, employee_id FROM users;` to see what's in the DB.

### Approval buttons don't appear
- Verify the logged-in user's role matches the current approval step's `approver_role`.
- Check: `SELECT email, role FROM users WHERE email = 'your-email';`

### Supabase Storage error on document upload
- The bucket is auto-created on first upload using `SUPABASE_SERVICE_ROLE_KEY`.
- Make sure the service role key is correct in `.env.local`.

### Accurate API errors
- Verify `ACCURATE_ACCESS_TOKEN` is not expired.
- Check `/api/accurate-debug` endpoint for debugging.
- The app works without Accurate (balances will just show 0 from Accurate source).

### Excel column mismatch
- Each Excel file type has specific column/row mappings hardcoded in the API.
- If the Excel structure changed, the column indices in the API route may need updating.
- Check the API source files:
  - `src/app/api/upload/simpanan-saldo/route.ts`
  - `src/app/api/upload/pinjaman-saldo/route.ts`
  - `src/app/api/upload/potongan/route.ts`
