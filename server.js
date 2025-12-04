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


//-------------WP 3.1 ----------- //
// Get all clients
app.get("/api/clients", authenticateToken, async (req, res) => {
  console.log(`[CLIENTS] Fetching clients for user: ${req.user.username}`)
  const query = "SELECT * FROM Klien"
  try {
    const result = await loggedQuery(query, [])
    console.log(`[CLIENTS] Found ${result.recordset.length} clients`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[CLIENTS] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Add new client
app.post("/api/clients", authenticateToken, async (req, res) => {
  const { nama, alamat, noTelp, email } = req.body
  console.log(`[CLIENTS] Adding new client: ${nama} by user: ${req.user.username}`)

  const query = "INSERT INTO Klien (Nama, Alamat, NoTelp, Email) OUTPUT INSERTED.IdKlien VALUES (?, ?, ?, ?)"
  try {
    const result = await loggedQuery(query, [nama, alamat, noTelp, email])
    console.log(`[CLIENTS] Client added successfully with ID: ${result.recordset[0].IdKlien}`)
    res.json({ message: "Klien berhasil ditambahkan", id: result.recordset[0].IdKlien })
  } catch (err) {
    console.error("[CLIENTS] Error adding client:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Delete client (for assistants)
app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
  const clientId = req.params.id
  console.log(`[DELETE-CLIENT] Deleting client ID: ${clientId} by user: ${req.user.username}`)

  try {
    // Check if client is used in any events
    const checkQuery = "SELECT COUNT(*) as count FROM Event WHERE IdKlien = ?"
    const checkResult = await loggedQuery(checkQuery, [clientId])

    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({
        error: "Tidak dapat menghapus klien ini karena memiliki event",
        details: `Klien ini memiliki ${checkResult.recordset[0].count} event. Hapus atau transfer event tersebut terlebih dahulu.`,
        constraint: "foreign_key",
      })
    }

    // Delete client
    const deleteQuery = "DELETE FROM Klien WHERE IdKlien = ?"
    const result = await loggedQuery(deleteQuery, [clientId])

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Klien tidak ditemukan" })
    }

    console.log(`[DELETE-CLIENT] Client deleted successfully: ${clientId}`)
    res.json({ message: "Klien berhasil dihapus" })
  } catch (err) {
    console.error("[DELETE-CLIENT] Database error:", err)

    // Check for specific SQL Server FK constraint errors
    if (err.message.includes("REFERENCE constraint") || err.message.includes("FOREIGN KEY")) {
      return res.status(400).json({
        error: "Tidak dapat menghapus klien ini karena memiliki event yang terkait",
        details: "Klien ini masih memiliki event yang terhubung. Hapus event tersebut terlebih dahulu.",
        constraint: "foreign_key",
      })
    }

    return res.status(500).json({ error: "Database error" })
  }
})

//3.3
app.get("/api/events", authenticateToken, async (req, res) => {
  console.log(`[EVENTS] Fetching events for user: ${req.user.username} (${req.user.role})`)

  try {
    let query = `
      SELECT e.*, je.Nama as JenisEventNama, k.Nama as KlienNama, p.Nama as PenggunaNama
      FROM Event e
      LEFT JOIN JenisEvent je ON e.IdJenisEvent = je.IdJenisEvent
      LEFT JOIN Klien k ON e.IdKlien = k.IdKlien
      LEFT JOIN Pengguna p ON e.IdPengguna = p.IdPengguna
    `

    let params = []
    // Jika asisten, hanya tampilkan event yang ditangani oleh mereka
    if (req.user.role === "asisten") {
      query += " WHERE e.IdPengguna = ?"
      params = [req.user.id]
    }

    const result = await loggedQuery(query, params)
    console.log(`[EVENTS] Found ${result.recordset.length} events`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[EVENTS] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

app.post("/api/events", authenticateToken, async (req, res) => {
  const { nama, tglEvent, jumlahUndangan, budgetEvent, idJenisEvent, idKlien } = req.body
  console.log(`[EVENTS] Adding new event: ${nama} by user: ${req.user.username}`)

  const query = `
    INSERT INTO Event (Nama, TglEvent, JumlahUndangan, BudgetEvent, StatusEvent, IdJenisEvent, IdKlien, IdPengguna) 
    OUTPUT INSERTED.IdEvent
    VALUES (?, ?, ?, ?, 'On Progress', ?, ?, ?)
  `

  try {
    const result = await loggedQuery(query, [
      nama,
      tglEvent,
      jumlahUndangan,
      budgetEvent,
      idJenisEvent,
      idKlien,
      req.user.id,
    ])
    console.log(`[EVENTS] Event added successfully with ID: ${result.recordset[0].IdEvent}`)
    res.json({ message: "Event berhasil ditambahkan", id: result.recordset[0].IdEvent })
  } catch (err) {
    console.error("[EVENTS] Error adding event:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
  const eventId = req.params.id
  console.log(`[DELETE-EVENT] Deleting event ID: ${eventId} by user: ${req.user.username}`)

  try {
    // Check if user owns this event (for assistants) or is owner
    let checkQuery = "SELECT * FROM Event WHERE IdEvent = ?"
    const checkParams = [eventId]

    if (req.user.role === "asisten") {
      checkQuery += " AND IdPengguna = ?"
      checkParams.push(req.user.id)
    }

    const checkResult = await loggedQuery(checkQuery, checkParams)
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Event tidak ditemukan atau tidak memiliki akses" })
    }

    // Delete related EventVendor records first
    const deleteEventVendorQuery = "DELETE FROM EventVendor WHERE IdEvent = ?"
    await loggedQuery(deleteEventVendorQuery, [eventId])

    // Delete event
    const deleteQuery = "DELETE FROM Event WHERE IdEvent = ?"
    const result = await loggedQuery(deleteQuery, [eventId])

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Event tidak ditemukan" })
    }

    console.log(`[DELETE-EVENT] Event deleted successfully: ${eventId}`)
    res.json({ message: "Event berhasil dihapus" })
  } catch (err) {
    console.error("[DELETE-EVENT] Database error:", err)

    // Check for specific SQL Server FK constraint errors
    if (err.message.includes("REFERENCE constraint") || err.message.includes("FOREIGN KEY")) {
      return res.status(400).json({
        error: "Tidak dapat menghapus event ini karena memiliki data yang terkait",
        details:
          "Event ini masih memiliki vendor atau data lain yang terhubung. Sistem akan mencoba menghapus data terkait secara otomatis.",
        constraint: "foreign_key",
      })
    }

    return res.status(500).json({ error: "Database error" })
  }
})

// Update event status
app.put("/api/events/:id/status", authenticateToken, async (req, res) => {
  const eventId = req.params.id
  const { status } = req.body

  // Check if user owns this event (for assistants) or is owner
  let query = "UPDATE Event SET StatusEvent = ? WHERE IdEvent = ?"
  const params = [status, eventId]

  if (req.user.role === "asisten") {
    query += " AND IdPengguna = ?"
    params.push(req.user.id)
  }

  try {
    const result = await loggedQuery(query, params)
    if (result.rowsAffected[0] === 0) {
      console.log("[EVENT-STATUS] Event not found or no access")
      return res.status(404).json({ error: "Event tidak ditemukan atau tidak memiliki akses" })
    }

    console.log("[EVENT-STATUS] Event status updated successfully")
    res.json({ message: "Status event berhasil diupdate" })
  } catch (err) {
    console.error("[EVENT-STATUS] Error updating event status:", err)
    return res.status(500).json({ error: "Database error" })
  }
})


// Complete event
app.put("/api/events/:id/complete", authenticateToken, async (req, res) => {
  const eventId = req.params.id

  // Check if user owns this event (for assistants) or is owner
  let query = "UPDATE Event SET StatusEvent = 'Selesai' WHERE IdEvent = ?"
  const params = [eventId]

  if (req.user.role === "asisten") {
    query += " AND IdPengguna = ?"
    params.push(req.user.id)
  }

  try {
    const result = await loggedQuery(query, params)
    if (result.rowsAffected[0] === 0) {
      console.log("[EVENT-COMPLETE] Event not found or no access")
      return res.status(404).json({ error: "Event tidak ditemukan atau tidak memiliki akses" })
    }

    console.log("[EVENT-COMPLETE] Event completed successfully")
    res.json({ message: "Event berhasil diselesaikan" })
  } catch (err) {
    console.error("[EVENT-COMPLETE] Error completing event:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Get event types
app.get("/api/event-types", authenticateToken, async (req, res) => {
  const query = "SELECT * FROM JenisEvent"
  try {
    const result = await loggedQuery(query, [])
    console.log(`[EVENT-TYPES] Found ${result.recordset.length} event types`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[EVENT-TYPES] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

const jwt = require("jsonwebtoken")

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  console.log(`[AUTH] Token verification for ${req.method} ${req.path}`)

  if (!token) {
    console.log("[AUTH] No token provided")
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("[AUTH] Invalid token:", err.message)
      return res.status(403).json({ error: "Invalid token" })
    }
    console.log(`[AUTH] Token valid for user: ${user.username} (${user.role})`)
    req.user = user
    next()
  })
}

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body
  console.log(`[LOGIN] Login attempt for username: ${username}`)

  try {
    const query = "SELECT * FROM Pengguna WHERE Username = ?"
    const result = await loggedQuery(query, [username])

    if (result.recordset.length === 0) {
      console.log(`[LOGIN] User not found: ${username}`)
      return res.status(401).json({ error: "Username atau password salah" })
    }

    const user = result.recordset[0]
    console.log(`[LOGIN] User found: ${user.Username}, Role: ${user.Role}`)

    // Simple password check (in production, use bcrypt)
    if (password !== user.Password) {
      console.log(`[LOGIN] Invalid password for user: ${username}`)
      return res.status(401).json({ error: "Username atau password salah" })
    }

    const token = jwt.sign(
      {
        id: user.IdPengguna,
        username: user.Username,
        role: user.Role,
        nama: user.Nama,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    console.log(`[LOGIN] Login successful for ${username}, token generated`)
    res.json({
      token,
      user: {
        id: user.IdPengguna,
        nama: user.Nama,
        username: user.Username,
        role: user.Role,
      },
    })
  } catch (err) {
    console.error("[LOGIN] Database error during login:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Get all users (only for owner)
app.get("/api/users", authenticateToken, async (req, res) => {
  console.log(`[USERS] Access attempt by: ${req.user.username} (${req.user.role})`)

  if (req.user.role !== "pemilik_usaha") {
    console.log("[USERS] Access denied - not owner")
    return res.status(403).json({ error: "Access denied" })
  }

  const query = "SELECT IdPengguna, Nama, Alamat, NoTelp, Username, Role FROM Pengguna"
  try {
    const result = await loggedQuery(query, [])
    console.log(`[USERS] Found ${result.recordset.length} users`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[USERS] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Add new user (only for owner)
app.post("/api/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const { nama, alamat, noTelp, username, password } = req.body

  const query =
    "INSERT INTO Pengguna (Nama, Alamat, NoTelp, Username, Password, Role) OUTPUT INSERTED.IdPengguna VALUES (?, ?, ?, ?, ?, ?)"
  try {
    const result = await loggedQuery(query, [nama, alamat, noTelp, username, password, "asisten"])
    console.log(`[USERS] User added successfully with ID: ${result.recordset[0].IdPengguna}`)
    res.json({ message: "Karyawan berhasil ditambahkan", id: result.recordset[0].IdPengguna })
  } catch (err) {
    console.error("[USERS] Error adding user:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Delete user (only for owner)
app.delete("/api/users/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const userId = req.params.id
  console.log(`[DELETE-USER] Deleting user ID: ${userId} by owner: ${req.user.username}`)

  try {
    // Check if user exists and is not the current user
    const checkQuery = "SELECT * FROM Pengguna WHERE IdPengguna = ?"
    const checkResult = await loggedQuery(checkQuery, [userId])

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" })
    }

    if (checkResult.recordset[0].IdPengguna === req.user.id) {
      return res.status(400).json({ error: "Tidak dapat menghapus akun sendiri" })
    }

    // Check if user has events (FK constraint)
    const eventCheckQuery = "SELECT COUNT(*) as count FROM Event WHERE IdPengguna = ?"
    const eventCheckResult = await loggedQuery(eventCheckQuery, [userId])

    if (eventCheckResult.recordset[0].count > 0) {
      return res.status(400).json({
        error: "Tidak dapat menghapus asisten ini karena masih memiliki event yang terkait",
        details: `Asisten ini memiliki ${eventCheckResult.recordset[0].count} event. Hapus atau transfer event tersebut terlebih dahulu.`,
        constraint: "foreign_key",
      })
    }

    // Delete user
    const deleteQuery = "DELETE FROM Pengguna WHERE IdPengguna = ?"
    const result = await loggedQuery(deleteQuery, [userId])

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" })
    }

    console.log(`[DELETE-USER] User deleted successfully: ${userId}`)
    res.json({ message: "User berhasil dihapus" })
  } catch (err) {
    console.error("[DELETE-USER] Database error:", err)

    // Check for specific SQL Server FK constraint errors
    if (err.message.includes("REFERENCE constraint") || err.message.includes("FOREIGN KEY")) {
      return res.status(400).json({
        error: "Tidak dapat menghapus asisten ini karena masih memiliki data yang terkait",
        details: "Asisten ini memiliki event atau data lain yang masih terhubung. Hapus data terkait terlebih dahulu.",
        constraint: "foreign_key",
      })
    }

    return res.status(500).json({ error: "Database error" })
  }
})