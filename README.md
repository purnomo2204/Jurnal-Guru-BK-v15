
# Panduan Publikasi (Deployment) - Jurnal Guru Wali Premium

Aplikasi ini dibuat menggunakan React, TypeScript, dan Tailwind CSS. Untuk membuatnya dapat diakses secara publik oleh orang lain, ikuti panduan berikut:

## Metode 1: Menggunakan Vercel (Sangat Direkomendasikan)
1. Buat akun di [Vercel](https://vercel.com).
2. Install [Vercel CLI](https://vercel.com/docs/cli) atau hubungkan dengan akun GitHub Anda.
3. Jika menggunakan GitHub: 
   - Push kode Anda ke repository GitHub.
   - Di Dashboard Vercel, klik "Add New" > "Project".
   - Import repository Anda dan klik **Deploy**.

## Metode 2: Build Manual dengan Vite
Jika Anda ingin menghostingnya di cPanel atau hosting statis lainnya:
1. Pastikan Anda memiliki [Node.js](https://nodejs.org/) terinstall.
2. Buka terminal di folder proyek dan jalankan:
   ```bash
   npm install
   npm run build
   ```
3. Folder `dist` akan muncul. Upload seluruh isi folder `dist` tersebut ke server hosting Anda.

## Konfigurasi Google Sheets
Agar fitur Cloud Sync bekerja untuk orang lain:
1. Setiap pengguna harus memiliki Google Spreadsheet sendiri.
2. Salin kode Apps Script yang ada di menu **Settings** aplikasi ke Spreadsheet mereka.
3. Deploy Apps Script sebagai Web App dengan akses "Anyone".
4. Masukkan URL yang dihasilkan ke dalam pengaturan aplikasi mereka masing-masing.

---
Dibuat dengan ❤️ untuk Guru Indonesia.
