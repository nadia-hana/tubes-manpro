# tubes-manpro
# Sistem Pengelolaan Event Organizer
## Fitur
### Untuk Pemilik Usaha:
- Dashboard overview dengan statistik bisnis
- Kelola karyawan (asisten)
- Kelola vendor dan jenis vendor
- Lihat semua event dari semua asisten
- Laporan vendor terpopuler
- Laporan event per asisten
- Laporan pendapatan bulanan

### Untuk Asisten:
- Dashboard personal dengan statistik event pribadi
- Kelola data klien
- Kelola event yang ditangani
- Lihat daftar vendor dengan filter
- Laporan budget per event
- Laporan event pribadi

## Akun Demo

### Pemilik Usaha:
- Username: `ahmad_owner`
- Password: `password123`

### Asisten:
- Username: `siti_asisten`
- Password: `pass123`
- Username: `rina_asisten`
- Password: `pass123`
- Username: `dodo`
- Password: `dodo123`

## Struktur Database
- **JenisEvent**: Jenis-jenis event (Wedding, Sweet 17, dll)
- **JenisVendor**: Kategori vendor (Catering, Dekorasi, dll)
- **Pengguna**: Data user (pemilik & asisten)
- **Klien**: Data klien
- **Vendor**: Data vendor dengan harga dan kategori
- **Event**: Data event dengan relasi ke klien, asisten, dan jenis event
- **EventVendor**: Relasi many-to-many antara event dan vendor dengan harga dealing
