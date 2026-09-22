# 📚 Tugas Kuliah — Web App

Aplikasi web input tugas kuliah yang terhubung dengan **Google Sheets** dan **Telegram Bot**.

---

## 📁 Struktur File

```
tugaskuliah/
├── index.html      ← Halaman utama
├── style.css       ← CSS profesional (diperbaharui)
├── script.js       ← Logic form + koneksi API
├── manifest.json   ← PWA manifest
├── favicon.ico     ← Icon browser (sediakan sendiri)
└── favicon.png     ← Icon PWA (sediakan sendiri)
```

---

## ✅ Yang Diperbarui

### CSS (style.css)
- **Typografi**: DM Sans (body) + Playfair Display (heading)
- **Warna**: Sistem palet Deep Teal × Warm Cream yang konsisten
- **Layout**: Card dengan header, form area, dan footer terstruktur
- **Komponen**:
  - Input/select dengan hover & focus state
  - Format buttons sebagai chip selector responsif
  - Submit button dengan shimmer animation
  - DB button dengan pill style
  - Loading spinner dual-ring
  - Success popup dengan animasi profesional
- **Animasi**: Page fade-in, card rise, icon bounce, shimmer, popIn
- **Responsif**: Breakpoint 1200px / 992px / 768px / 576px / 360px
- **Aksesibilitas**: focus-visible, prefers-reduced-motion

### HTML (index.html)
- Penambahan `.card-header` untuk area branding
- Penambahan `.card-footer` untuk tombol database
- Penambahan `.field-row` untuk layout tanggal side-by-side
- Penambahan `.select-wrapper` untuk custom arrow select
- Label dilengkapi ikon
- Semua ID, class, name, dan koneksi **TIDAK DIUBAH**

### script.js
- Semua logika, API key, endpoint **TIDAK DIUBAH**
- Tambahan: tutup popup saat klik overlay

---

## 🔗 Koneksi (Tidak Diubah)

| Target | URL |
|--------|-----|
| Google Sheets | `https://script.google.com/...` |
| Telegram Bot | `@fyi24a_bot` |
| Database View | `https://script.google.com/...` |

---

## 🚀 Deploy

Upload semua file ke GitHub Pages atau hosting pilihan Anda.  
Pastikan `favicon.png` tersedia untuk PWA icon.
