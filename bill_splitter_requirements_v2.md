# 📄 Bill Splitter App – Requirement Document

## 1. 📌 Overview
Aplikasi ini dibuat untuk membantu tim (khususnya QA / kantor) dalam membagi tagihan saat makan bersama atau work from cafe (WFC).

Permasalahan utama:
- Satu orang membayar seluruh tagihan
- Sulit mencatat pesanan tiap orang
- Perhitungan manual rawan error
- Proses penagihan tidak efisien

---

## 2. 🎯 Objectives
- Mempermudah pencatatan pesanan per orang
- Menghitung pembagian tagihan secara otomatis
- Menghasilkan summary tagihan yang siap dibagikan
- Mengurangi human error dalam perhitungan

---

## 3. 👤 User Roles

### 3.1 Host (Pembayar)
- Membuat session bill
- Mengelola member
- Menginput atau mengontrol item
- Generate tagihan

### 3.2 Member (Peserta)
- Join session
- Input pesanan sendiri (opsional)
- Melihat summary tagihan

---

## 4. 🧩 Features

### 4.1 MVP Features

#### A. Session Management
- Create session
- Nama session
- Deskripsi (opsional)
- Tanggal
- Generate link session

#### B. Member Management
- Tambah member manual
- Join via link
- Edit / hapus member

#### C. Item Management
- Tambah item:
  - Nama item
  - Harga
  - Assign ke 1 atau lebih member
- Edit / delete item

#### D. Bill Splitting
- Split berdasarkan item
- Split rata (equal split)
- Support multiple shared item

#### E. Calculation Enhancements (NEW)
- Optional Tax (% atau fixed amount)
- Optional Service Charge
- Optional Rounding:
  - Pembulatan ke atas (ceil)
  - Pembulatan ke bawah (floor)
  - Pembulatan ke nominal tertentu (contoh: 1000 / 5000)
- Configurable per session

#### F. Summary & Calculation
- Total per member
- Total keseluruhan
- Menampilkan breakdown:
  - Subtotal
  - Pajak
  - Service charge
  - Total akhir

#### G. Export / Sharing
- Copy summary ke clipboard
- Format text untuk WhatsApp / chat

---

## 5. 🔄 User Flow

### Scenario 1 – Basic Flow
1. Host membuat session
2. Host menambahkan member
3. Item dimasukkan
4. (Optional) Tambahkan pajak / service / rounding
5. Sistem menghitung otomatis
6. Host generate summary
7. Share ke grup

### Scenario 2 – Collaborative
1. Host membuat session
2. Share link
3. Member join
4. Input pesanan masing-masing
5. Real-time update
6. Generate summary

---

## 6. 🗂️ Data Model (High-Level)

### Session
- id
- name
- date
- created_by
- tax_type (percentage/fixed)
- tax_value
- service_charge
- rounding_type
- rounding_value

### Member
- id
- name
- session_id

### Item
- id
- name
- price
- session_id

### ItemAssignment
- item_id
- member_id

---

## 7. ⚙️ Functional Requirements

### 7.1 Session
- User dapat membuat session baru
- User dapat mengatur pajak, service charge, dan rounding (optional)

### 7.2 Member
- User dapat menambahkan member
- User dapat join session

### 7.3 Item
- User dapat menambahkan item
- User dapat assign item ke banyak member

### 7.4 Calculation
- Sistem menghitung subtotal
- Sistem menambahkan pajak & service charge (jika ada)
- Sistem melakukan rounding (jika diaktifkan)
- Sistem menghitung total per member secara proporsional

### 7.5 Output
- Sistem menampilkan summary tagihan lengkap
- User dapat copy hasil tagihan

---

## 8. ⚠️ Non-Functional Requirements

### Performance
- Support minimal 20–50 user per session

### Usability
- UI sederhana dan mobile friendly

### Reliability
- Perhitungan harus akurat (termasuk pajak & rounding)
- Data tidak hilang saat refresh

### Security
- Session menggunakan unique link (UUID)

---

## 9. 🧪 Testing Requirements

### Functional Testing
- Create session
- Add member
- Add item
- Split calculation
- Tax & service charge calculation
- Rounding behavior

### Edge Cases
- Member tanpa item
- Item shared ke banyak orang
- Kombinasi tax + rounding
- Pembulatan menyebabkan selisih total

### API Testing
- Validasi request & response
- Error handling

### Performance Testing
- Multiple user input bersamaan

---

## 10. 📊 Output Format (Example)

🍽️ WFC Starbucks

Subtotal: 45.000
Tax (10%): 4.500
Service: 500

Budi: 25.000
Ani: 25.000

Total: 50.000

Silakan transfer ya 🙏

---

## 11. 🚧 Constraints
- Fokus MVP
- Tidak perlu login system di awal
- Tidak perlu payment integration di fase awal

---

## 12. 📅 Milestones

### Phase 1 (MVP)
- Session + Member
- Item + Split
- Basic Summary

### Phase 2
- Tax, Service, Rounding
- Real-time
- QR Join

### Phase 3
- OCR
- Payment integration

---

## 13. 🧠 Success Criteria
- Split bill selesai < 3 menit
- Perhitungan akurat (termasuk pajak & rounding)
- Mudah digunakan
