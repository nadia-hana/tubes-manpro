-- =================================================================
-- BAGIAN 2: PENGISIAN DATA (INSERT DATA)
-- =================================================================

-- --- Data untuk Tabel JenisEvent ---
INSERT INTO JenisEvent (IdJenisEvent, Nama) VALUES
(1, 'Wedding'),
(2, 'Sweet 17'),
(3, 'Gathering'),
(4, 'Seminar');

-- --- Data untuk Tabel JenisVendor ---
INSERT INTO JenisVendor (IdJenisVendor, Nama) VALUES
(1, 'Catering'),
(2, 'Dekorasi'),
(3, 'Photography'),
(4, 'Venue'),
(5, 'Entertainment');

-- --- Data untuk Tabel Pengguna ---
INSERT INTO Pengguna (IdPengguna, Nama, Alamat, NoTelp, Username, Password, Role) VALUES
(1, 'Ahmad Wijaya', 'Jl. Sudirman No. 1', '081122334455', 'ahmad_owner', 'password123', 'pemilik_usaha'),
(2, 'Siti Nurhaliza', 'Jl. Thamrin No. 45, Jakarta', '081234567891', 'siti_asisten', 'pass123', 'asisten'),
(3, 'Rina Kusuma', 'Jl. Rasuna Said No. 89, Jakarta', '081234567893', 'rina_asisten', 'pass123', 'asisten'),
(4, 'Dodo', 'Dago', '0818479263', 'dodo', 'dodo123', 'asisten');

-- --- Data untuk Tabel Klien ---
INSERT INTO Klien (IdKlien, Nama, Alamat, NoTelp, Email) VALUES
(1, 'Budi Santoso', 'Jl. Mawar No. 10, Bandung', '085611223344', 'budi.s@email.com'),
(2, 'Citra Lestari', 'Jl. Melati No. 5, Jakarta', '087811223355', 'citra.l@email.com'),
(3, 'PT Sejahtera Abadi', 'Gedung Menara Pancoran', '021-5550001', 'contact@sejahtera.co.id'),
(4, 'Kapi', 'Bojongsoang', '0819276619', 'kapi@email.com');

-- --- Data untuk Tabel Vendor ---
INSERT INTO Vendor (IdVendor, Nama, NamaPemilik, Alamat, NoTelp, Harga, IdJenisVendor) VALUES
(1, 'Catering Sedap Mantap', 'Ibu Sari', 'Jl. Kalibata No. 12', '021-8901234', 150000.00, 1),
(2, 'Dekorasi Indah Permai', 'Pak Joko', 'Jl. Cempaka Putih No. 25', '021-8901235', 5000000.00, 2),
(7, 'Catering Royal Taste', 'Bp. Haryono', 'Jl. Menteng No. 33', '021-8901240', 250000.00, 1),
(8, 'Abadi Photography', 'Rian', 'Jl. Fotografia No. 1', '081311223366', 7500000.00, 3),
(9, 'Grand Ballroom Hotel', 'Hotel Group', 'Jl. Gatot Subroto Kav. 9', '021-25502550', 25000000.00, 4);

-- --- Data untuk Tabel Event ---
INSERT INTO Event (IdEvent, Nama, TglEvent, JumlahUndangan, BudgetEvent, StatusEvent, IdJenisEvent, IdKlien, IdPengguna) VALUES
(1, 'Pernikahan Budi & Ani', '2024-08-17', 300, 80000000.00, 'Selesai', 1, 1, 2),
(2, 'Sweet 17 Party Citra', '2025-09-25', 150, 50000000.00, 'On Progress', 2, 2, 3),
(3, 'Annual Gathering PT SA', '2025-10-10', 200, 120000000.00, 'On Progress', 3, 3, 2),
(4, 'Seminar Digital Marketing', '2025-11-05', 100, 30000000.00, 'On Progress', 4, 2, 3),
(5, 'Weeding Kapibara', '2025-01-01', 100, 10000000.00, 'On Progress', 1, 4, 4);

-- --- Data untuk Tabel EventVendor ---
INSERT INTO EventVendor (IdEvent, IdVendor, HargaDealing) VALUES
(1, 1, 40000000.00),
(1, 2, 15000000.00),
(2, 7, 35000000.00),
(2, 8, 8000000.00),
(3, 7, 55000000.00),
(3, 9, 40000000.00),
(4, 9, 20000000.00);
