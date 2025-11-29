-- =================================================================
-- BAGIAN 1: PEMBUATAN TABEL (CREATE TABLES)
-- =================================================================

-- Menghapus tabel jika sudah ada (untuk inisiasi ulang)
DROP TABLE IF EXISTS EventVendor;
DROP TABLE IF EXISTS Event;
DROP TABLE IF EXISTS Vendor;
DROP TABLE IF EXISTS Klien;
DROP TABLE IF EXISTS Pengguna;
DROP TABLE IF EXISTS JenisVendor;
DROP TABLE IF EXISTS JenisEvent;

-- --- Tabel JenisEvent ---
CREATE TABLE JenisEvent (
    IdJenisEvent INT PRIMARY KEY AUTO_INCREMENT,
    Nama VARCHAR(100)
);

-- --- Tabel JenisVendor ---
CREATE TABLE JenisVendor (
    IdJenisVendor INT PRIMARY KEY AUTO_INCREMENT,
    Nama VARCHAR(100)
);

-- --- Tabel Pengguna ---
CREATE TABLE Pengguna (
    IdPengguna INT PRIMARY KEY AUTO_INCREMENT,
    Nama VARCHAR(100),
    Alamat VARCHAR(255),
    NoTelp VARCHAR(20),
    Username VARCHAR(50),
    Password VARCHAR(50),
    Role VARCHAR(20)
);

-- --- Tabel Klien ---
CREATE TABLE Klien (
    IdKlien INT PRIMARY KEY AUTO_INCREMENT,
    Nama VARCHAR(100),
    Alamat VARCHAR(255),
    NoTelp VARCHAR(20),
    Email VARCHAR(100)
);

-- --- Tabel Vendor ---
CREATE TABLE Vendor (
    IdVendor INT PRIMARY KEY AUTO_INCREMENT,
    Nama VARCHAR(100),
    NamaPemilik VARCHAR(100),
    Alamat VARCHAR(255),
    NoTelp VARCHAR(20),
    Harga DECIMAL(15,2),
    IdJenisVendor INT,
    FOREIGN KEY (IdJenisVendor) REFERENCES JenisVendor(IdJenisVendor)
);

-- --- Tabel Event ---
CREATE TABLE Event (
    IdEvent INT PRIMARY KEY AUTO_INCREMENT,
    Nama VARCHAR(100),
    TglEvent DATE,
    JumlahUndangan INT,
    BudgetEvent DECIMAL(15,2),
    StatusEvent VARCHAR(50),
    IdJenisEvent INT,
    IdKlien INT,
    IdPengguna INT,
    FOREIGN KEY (IdJenisEvent) REFERENCES JenisEvent(IdJenisEvent),
    FOREIGN KEY (IdKlien) REFERENCES Klien(IdKlien),
    FOREIGN KEY (IdPengguna) REFERENCES Pengguna(IdPengguna)
);

-- --- Tabel EventVendor ---
CREATE TABLE EventVendor (
    IdEvent INT,
    IdVendor INT,
    HargaDealing DECIMAL(15,2),
    PRIMARY KEY (IdEvent, IdVendor),
    FOREIGN KEY (IdEvent) REFERENCES Event(IdEvent),
    FOREIGN KEY (IdVendor) REFERENCES Vendor(IdVendor)
);
