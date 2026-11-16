# Naik v2 — Weight Gain & Muscle Building Companion

PWA mobile-first, offline-first untuk program kenaikan berat badan dan latihan otot dengan **2 dumbbell 5 kg**. Ini adalah **pengembangan dari proyek Naik sebelumnya**, bukan proyek baru. Desain, jurnal makanan, penimbangan, grafik, dan fitur ekspor/impor tetap dipertahankan.

## Fitur baru v2

- **Weekly Workout Planner**: Senin–Minggu, jam latihan bawaan 17.30 WIB, durasi dan tipe latihan setiap hari, kalender pekan berjalan, serta perkiraan jam mulai–selesai tiap gerakan. Jam bisa diganti di Profil.
- **Panduan 8 minggu**: minggu 1 adaptasi (2 set per gerakan), minggu 2–3 set normal, minggu 4–7 panduan progresi repetisi/tempo, minggu 8 evaluasi. Nomor minggu dihitung dari tanggal mulai program yang dapat diubah di Profil.
- **Tutorial bergambar lokal**: gambar untuk 9 jenis gerakan (dipakai ulang untuk slow push-up), langkah demi langkah, kesalahan umum, kelompok otot, target set/repetisi, alat, dan jeda.
- **Guided Workout**: sesi tersimpan otomatis, catatan repetisi/durasi, beban dumbbell per tangan, set berikutnya, countdown istirahat otomatis, dan tombol lewati istirahat. Berpindah tab atau refresh tidak menghapus sesi aktif.
- **Workout History**: sesi yang sudah selesai, durasi aktual, jumlah set, detail repetisi dan beban tiap gerakan. Ringkasan konsistensi dalam minggu kalender Senin–Minggu.
- **Aktivitas ringan**: tandai jalan cepat/mobilitas pada Selasa, Kamis, Sabtu; Minggu merupakan hari istirahat.
- **Tampilan mobile-first** dan aset foto yang disimpan untuk penggunaan offline setelah PWA pertama kali dimuat.

## Jadwal latihan bawaan

| Hari | Pukul | Program | Perkiraan durasi |
|---|---|---|---|
| Senin | 17.30 WIB | Dada & punggung A | 45 menit |
| Selasa | 17.30 WIB | Jalan cepat + mobilitas | 30 menit |
| Rabu | 17.30 WIB | Kaki & core | 50 menit |
| Kamis | 17.30 WIB | Jalan cepat + mobilitas | 30 menit |
| Jumat | 17.30 WIB | Dada & punggung B | 50 menit |
| Sabtu | 17.30 WIB | Jalan santai | 30 menit |
| Minggu | Fleksibel | Istirahat | — |

Setiap sesi beban menyertakan pemanasan 7 menit dan pendinginan 5 menit. Waktu gerakan pada kalender adalah **perkiraan**; gunakan timer istirahat selama sesi untuk alur sebenarnya. Selalu utamakan bentuk gerakan yang benar dan pemulihan.

### Menggunakan Guided Workout

1. Buka **Latihan**, pilih hari, baca urutan gerakan dan ketuk **Lihat cara gerakan** jika perlu.
2. Ketuk **Mulai workout**, lakukan pemanasan 7 menit, lalu catat set pertama.
3. Isi **repetisi aktual** (plank memakai detik) dan **berat dumbbell** yang benar-benar digunakan. Setelah set dicatat, countdown istirahat akan berjalan.
4. Ketuk **Lewati istirahat** jika memang sudah siap; setelah seluruh set satu gerakan selesai, ketuk **Lanjut gerakan berikutnya**.
5. Setelah seluruh gerakan selesai, lakukan pendinginan 5 menit dan ketuk **Selesaikan workout**. Sesi muncul di Riwayat latihan.

Sesi aktif tersimpan dalam localStorage; timer menggunakan waktu yang tersimpan, jadi tidak di-reset oleh refresh atau perpindahan tab. Durasi sesi adalah selisih waktu mulai hingga selesai (termasuk jika kamu meninggalkan sesi berjam-jam). Belum ada sistem pause otomatis, sensor form, atau verifikasi gerakan lewat kamera.

## Menjalankan secara lokal

Tidak memerlukan npm, database, API, atau framework. Gunakan server statis:

```bash
cd naik-pwa
python3 -m http.server 8080
```

Buka `http://localhost:8080` di browser. Untuk instalasi PWA di HP, deploy folder **naik-pwa** ke HTTPS, lalu gunakan **Install app** (Android) atau **Bagikan → Tambah ke Layar Utama** (Safari iPhone).

> Jangan buka via `file://` bila ingin menguji service worker. PWA memerlukan localhost atau HTTPS.

## Upgrade dari versi lama — penting

- **Data lama tidak perlu dihapus.** Aplikasi tetap menggunakan key localStorage `naik-pwa-v1` untuk kompatibilitas URL/domain yang sama. Data versi 1 dibaca lalu ditambahkan field versi 2 (`workoutSessions`, `activityLogs`, `activeWorkout`, `workoutSettings`).
- **Sebelum upload, ekspor backup JSON** dari aplikasi lama melalui tab Profil. Jika pemasangan di domain atau path lain, localStorage browser tidak otomatis ikut pindah: gunakan fitur **Impor JSON** di versi baru.
- Backup JSON **versi 1 maupun versi 2** dapat diimpor. Impor menggantikan seluruh data yang sedang tersimpan, jadi ekspor cadangan dulu.
- Checklist workout lama (`workouts`) **tetap disimpan** dan tetap dihitung dalam konsistensi bila lengkap, tetapi tidak diubah otomatis menjadi catatan set baru karena repetisi dan bebannya tidak tersedia.
- Service worker dinaikkan dari cache `naik-pwa-v1` ke `naik-pwa-v2` agar foto-foto, CSS, dan JavaScript baru bisa dimuat offline. Jika sudah pernah memasang PWA lama, buka aplikasinya secara online dan refresh/close–reopen agar versi baru aktif.

## Struktur folder

```text
naik-pwa/
├── index.html
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── app.js
│   ├── styles.css
│   ├── icon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── exercises/
│       ├── floor_press.jpg
│       ├── pushup.jpg
│       ├── squeeze_press.jpg
│       ├── bent_row.jpg
│       ├── goblet_squat.jpg
│       ├── rdl.jpg
│       ├── reverse_lunge.jpg
│       ├── glute_bridge.jpg
│       └── plank.jpg
└── README.md
```

## Batasan & keamanan

- Semua data disimpan **lokal di browser/perangkat**, tidak tersinkron antar-perangkat. Menghapus data situs/browser dapat menghapusnya: backup JSON berkala.
- Foto adalah ilustrasi **satu posisi gerakan**, bukan video tutorial atau pemeriksaan teknik real-time.
- Waktu workout dan nutrisi adalah target awal yang perlu disesuaikan dengan pemulihan dan tren berat badan. Hentikan gerakan jika ada nyeri tajam, pusing, sesak yang tidak biasa, atau gejala mengkhawatirkan.
- Tidak ada push notification, cloud backup, atau autentikasi dalam versi ini.
- Versi ini tetap mempertahankan HTML, CSS, JavaScript vanilla, dan Service Worker; **tidak memakai React, Vue, atau backend**.
