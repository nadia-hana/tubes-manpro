// ------------WP 3.2------------ //

// Get all vendors
app.get("/api/vendors", authenticateToken, async (req, res) => {
  console.log(`[VENDORS] Fetching vendors for user: ${req.user.username}`)
  const query = `
    SELECT v.*, jv.Nama as JenisVendorNama
    FROM Vendor v
    LEFT JOIN JenisVendor jv ON v.IdJenisVendor = jv.IdJenisVendor
  `
  try {
    const result = await loggedQuery(query, [])
    console.log(`[VENDORS] Found ${result.recordset.length} vendors`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[VENDORS] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Add new vendor (only for owner)
app.post("/api/vendors", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const { nama, namaPemilik, alamat, noTelp, harga, idJenisVendor } = req.body

  const query =
    "INSERT INTO Vendor (Nama, NamaPemilik, Alamat, NoTelp, Harga, IdJenisVendor) OUTPUT INSERTED.IdVendor VALUES (?, ?, ?, ?, ?, ?)"
  try {
    const result = await loggedQuery(query, [nama, namaPemilik, alamat, noTelp, harga, idJenisVendor])
    console.log(`[VENDORS] Vendor added successfully with ID: ${result.recordset[0].IdVendor}`)
    res.json({ message: "Vendor berhasil ditambahkan", id: result.recordset[0].IdVendor })
  } catch (err) {
    console.error("[VENDORS] Error adding vendor:", err)
    return res.status(500).json({ error: "Database error" })
  }
})


// Update vendor (only for owner)
app.put("/api/vendors/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const vendorId = req.params.id
  const { nama, namaPemilik, alamat, noTelp, harga, idJenisVendor } = req.body
  console.log(`[UPDATE-VENDOR] Updating vendor ID: ${vendorId} by owner: ${req.user.username}`)

  try {
    const updateQuery = `
      UPDATE Vendor 
      SET Nama = ?, NamaPemilik = ?, Alamat = ?, NoTelp = ?, Harga = ?, IdJenisVendor = ?
      WHERE IdVendor = ?
    `
    const result = await loggedQuery(updateQuery, [nama, namaPemilik, alamat, noTelp, harga, idJenisVendor, vendorId])

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Vendor tidak ditemukan" })
    }

    console.log(`[UPDATE-VENDOR] Vendor updated successfully: ${vendorId}`)
    res.json({ message: "Vendor berhasil diperbarui" })
  } catch (err) {
    console.error("[UPDATE-VENDOR] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Delete vendor (only for owner)
app.delete("/api/vendors/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const vendorId = req.params.id
  console.log(`[DELETE-VENDOR] Deleting vendor ID: ${vendorId} by owner: ${req.user.username}`)

  try {
    // Check if vendor is used in any events
    const checkQuery = "SELECT COUNT(*) as count FROM EventVendor WHERE IdVendor = ?"
    const checkResult = await loggedQuery(checkQuery, [vendorId])

    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({
        error: "Tidak dapat menghapus vendor ini karena sedang digunakan dalam event",
        details: `Vendor ini digunakan dalam ${checkResult.recordset[0].count} event. Hapus vendor dari event tersebut terlebih dahulu.`,
        constraint: "foreign_key",
      })
    }

    // Delete vendor
    const deleteQuery = "DELETE FROM Vendor WHERE IdVendor = ?"
    const result = await loggedQuery(deleteQuery, [vendorId])

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Vendor tidak ditemukan" })
    }

    console.log(`[DELETE-VENDOR] Vendor deleted successfully: ${vendorId}`)
    res.json({ message: "Vendor berhasil dihapus" })
  } catch (err) {
    console.error("[DELETE-VENDOR] Database error:", err)

    // Check for specific SQL Server FK constraint errors
    if (err.message.includes("REFERENCE constraint") || err.message.includes("FOREIGN KEY")) {
      return res.status(400).json({
        error: "Tidak dapat menghapus vendor ini karena masih digunakan dalam event",
        details: "Vendor ini masih terhubung dengan event yang ada. Hapus vendor dari event tersebut terlebih dahulu.",
        constraint: "foreign_key",
      })
    }

    return res.status(500).json({ error: "Database error" })
  }
})

// Get vendor types
app.get("/api/vendor-types", authenticateToken, async (req, res) => {
  const query = "SELECT * FROM JenisVendor"
  try {
    const result = await loggedQuery(query, [])
    console.log(`[VENDOR-TYPES] Found ${result.recordset.length} vendor types`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[VENDOR-TYPES] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Get vendor usage statistics for analytics
app.get("/api/vendor-usage-stats", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  console.log("[VENDOR-STATS] Fetching vendor usage statistics")

  const query = `
    SELECT 
      v.Nama as VendorNama,
      jv.Nama as JenisVendor,
      COUNT(ev.IdVendor) as JumlahPenggunaan,
      AVG(ev.HargaDealing) as RataRataHarga
    FROM Vendor v
    LEFT JOIN JenisVendor jv ON v.IdJenisVendor = jv.IdJenisVendor
    LEFT JOIN EventVendor ev ON v.IdVendor = ev.IdVendor
    GROUP BY v.IdVendor, v.Nama, jv.Nama
    HAVING COUNT(ev.IdVendor) > 0
    ORDER BY JumlahPenggunaan DESC, RataRataHarga DESC
  `

  try {
    const result = await loggedQuery(query, [])
    console.log(`[VENDOR-STATS] Found ${result.recordset.length} vendor usage statistics`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[VENDOR-STATS] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// ------------WP 3.2------------ //
