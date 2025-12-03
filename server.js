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

// ==== WP 3. 4 ==== //
// Get event budget details
app.get("/api/events/:id/budget", authenticateToken, async (req, res) => {
  const eventId = req.params.id

  const query = `
    SELECT ev.*, v.Nama as VendorNama, jv.Nama as JenisVendorNama
    FROM EventVendor ev
    LEFT JOIN Vendor v ON ev.IdVendor = v.IdVendor
    LEFT JOIN JenisVendor jv ON v.IdJenisVendor = jv.IdJenisVendor
    WHERE ev.IdEvent = ?
  `

  try {
    const result = await loggedQuery(query, [eventId])
    console.log(`[EVENT-BUDGET] Found ${result.recordset.length} budget details for event ID: ${eventId}`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[EVENT-BUDGET] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})


app.post("/api/events/:id/vendors", authenticateToken, async (req, res) => {
  const eventId = req.params.id
  const { idVendor, hargaDealing } = req.body

  // Check if user owns this event (for assistants) or is owner
  let checkQuery = "SELECT * FROM Event WHERE IdEvent = ?"
  const checkParams = [eventId]

  if (req.user.role === "asisten") {
    checkQuery += " AND IdPengguna = ?"
    checkParams.push(req.user.id)
  }

  try {
    const checkResult = await loggedQuery(checkQuery, checkParams)
    if (checkResult.recordset.length === 0) {
      console.log("[EVENT-VENDOR] Event not found or no access")
      return res.status(404).json({ error: "Event tidak ditemukan atau tidak memiliki akses" })
    }

    const mergeQuery = `
      MERGE EventVendor AS target
      USING (SELECT ? AS IdEvent, ? AS IdVendor, ? AS HargaDealing) AS source
      ON (target.IdEvent = source.IdEvent AND target.IdVendor = source.IdVendor)
      WHEN MATCHED THEN
        UPDATE SET HargaDealing = source.HargaDealing
      WHEN NOT MATCHED THEN
        INSERT (IdEvent, IdVendor, HargaDealing)
        VALUES (source.IdEvent, source.IdVendor, source.HargaDealing);
    `
    const mergeParams = [eventId, idVendor, hargaDealing]
    await loggedQuery(mergeQuery, mergeParams)
    console.log("[EVENT-VENDOR] Vendor added to event successfully")
    res.json({ message: "Vendor berhasil ditambahkan ke event" })
  } catch (err) {
    console.error("[EVENT-VENDOR] Error adding vendor to event:", err)
    return res.status(500).json({ error: "Database error", message: err.message })
  }
})


// Remove vendor from event
app.delete("/api/events/:eventId/vendors/:vendorId", authenticateToken, async (req, res) => {
  const { eventId, vendorId } = req.params

  // Check if user owns this event (for assistants) or is owner
  let checkQuery = "SELECT * FROM Event WHERE IdEvent = ?"
  const checkParams = [eventId]

  if (req.user.role === "asisten") {
    checkQuery += " AND IdPengguna = ?"
    checkParams.push(req.user.id)
  }

  try {
    const checkResult = await loggedQuery(checkQuery, checkParams)
    if (checkResult.recordset.length === 0) {
      console.log("[EVENT-VENDOR] Event not found or no access")
      return res.status(404).json({ error: "Event tidak ditemukan atau tidak memiliki akses" })
    }

    // Remove vendor from event
    const deleteQuery = "DELETE FROM EventVendor WHERE IdEvent = ? AND IdVendor = ?"
    const deleteParams = [eventId, vendorId]
    const deleteResult = await loggedQuery(deleteQuery, deleteParams)
    console.log("[EVENT-VENDOR] Vendor removed from event successfully")
    res.json({ message: "Vendor berhasil dihapus dari event" })
  } catch (err) {
    console.error("[EVENT-VENDOR] Error removing vendor from event:", err)
    return res.status(500).json({ error: "Database error" })
  }
})


// Get dashboard statistics
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  console.log(`[DASHBOARD] Fetching stats for user: ${req.user.username} (${req.user.role})`)

  const queries = {
    totalEvents: "SELECT COUNT(*) as count FROM Event",
    totalVendors: "SELECT COUNT(*) as count FROM Vendor",
    totalClients: "SELECT COUNT(*) as count FROM Klien",
    totalAssistants: 'SELECT COUNT(*) as count FROM Pengguna WHERE Role = "asisten"',
    completedEvents: 'SELECT COUNT(*) as count FROM Event WHERE StatusEvent = "Selesai"',
    ongoingEvents: 'SELECT COUNT(*) as count FROM Event WHERE StatusEvent = "On Progress"',
  }

  // If assistant, filter events by user
  if (req.user.role === "asisten") {
    console.log("[DASHBOARD] Filtering stats for assistant")
    queries.totalEvents = "SELECT COUNT(*) as count FROM Event WHERE IdPengguna = ?"
    queries.completedEvents = 'SELECT COUNT(*) as count FROM Event WHERE StatusEvent = "Selesai" AND IdPengguna = ?'
    queries.ongoingEvents = 'SELECT COUNT(*) as count FROM Event WHERE StatusEvent = "On Progress" AND IdPengguna = ?'
  }

  const stats = {}
  const queryKeys = Object.keys(queries)
  let completed = 0

  queryKeys.forEach(async (key) => {
    const params = req.user.role === "asisten" && key.includes("Events") ? [req.user.id] : []

    try {
      const result = await loggedQuery(queries[key], params)
      stats[key] = result.recordset ? result.recordset[0].count : result.rowsAffected[0]
      console.log(`[DASHBOARD] ${key}: ${stats[key]}`)
    } catch (err) {
      console.error(`[DASHBOARD] Error in ${key} query:`, err)
      stats[key] = 0
    }

    completed++
    if (completed === queryKeys.length) {
      console.log("[DASHBOARD] All stats collected, sending response")
      res.json(stats)
    }
  })
})


// Get vendor popularity report
app.get("/api/reports/vendor-popularity", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const query = `
    SELECT v.Nama, v.NamaPemilik, jv.Nama as JenisVendorNama, 
           COUNT(ev.IdVendor) as JumlahPenggunaan,
           SUM(ev.HargaDealing) as TotalPendapatan
    FROM Vendor v
    LEFT JOIN JenisVendor jv ON v.IdJenisVendor = jv.IdJenisVendor
    LEFT JOIN EventVendor ev ON v.IdVendor = ev.IdVendor
    GROUP BY v.IdVendor
    ORDER BY JumlahPenggunaan DESC, TotalPendapatan DESC
  `

  try {
    const result = await loggedQuery(query, [])
    console.log(`[VENDOR-POPULARITY] Found ${result.recordset.length} vendor popularity reports`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[VENDOR-POPULARITY] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Get events per assistant report
app.get("/api/reports/events-per-assistant", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const query = `
    SELECT p.Nama as AsistenNama, 
           COUNT(e.IdEvent) as JumlahEvent,
           COUNT(CASE WHEN e.StatusEvent = 'Selesai' THEN 1 END) as EventSelesai,
           COUNT(CASE WHEN e.StatusEvent = 'On Progress' THEN 1 END) as EventBerlangsung,
           SUM(e.BudgetEvent) as TotalBudget
    FROM Pengguna p
    LEFT JOIN Event e ON p.IdPengguna = e.IdPengguna
    WHERE p.Role = 'asisten'
    GROUP BY p.IdPengguna
    ORDER BY JumlahEvent DESC
  `

  try {
    const result = await loggedQuery(query, [])
    console.log(`[EVENTS-PER-ASSISTANT] Found ${result.recordset.length} events per assistant reports`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[EVENTS-PER-ASSISTANT] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})

// Get events per assistant report
app.get("/api/reports/events-per-assistant", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const query = `
    SELECT p.Nama as AsistenNama, 
           COUNT(e.IdEvent) as JumlahEvent,
           COUNT(CASE WHEN e.StatusEvent = 'Selesai' THEN 1 END) as EventSelesai,
           COUNT(CASE WHEN e.StatusEvent = 'On Progress' THEN 1 END) as EventBerlangsung,
           SUM(e.BudgetEvent) as TotalBudget
    FROM Pengguna p
    LEFT JOIN Event e ON p.IdPengguna = e.IdPengguna
    WHERE p.Role = 'asisten'
    GROUP BY p.IdPengguna
    ORDER BY JumlahEvent DESC
  `

  try {
    const result = await loggedQuery(query, [])
    console.log(`[EVENTS-PER-ASSISTANT] Found ${result.recordset.length} events per assistant reports`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[EVENTS-PER-ASSISTANT] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})


// Get monthly revenue report
app.get("/api/reports/monthly-revenue", authenticateToken, async (req, res) => {
  if (req.user.role !== "pemilik_usaha") {
    return res.status(403).json({ error: "Access denied" })
  }

  const query = `
    SELECT 
      YEAR(e.TglEvent) as Tahun,
      MONTH(e.TglEvent) as Bulan,
      FORMAT(e.TglEvent, 'MMMM') as NamaBulan,
      COUNT(e.IdEvent) as JumlahEvent,
      SUM(e.BudgetEvent) as TotalBudget,
      COUNT(CASE WHEN e.StatusEvent = 'Selesai' THEN 1 END) as EventSelesai
    FROM Event e
    WHERE e.TglEvent >= DATEADD(year, -1, GETDATE())
    GROUP BY YEAR(e.TglEvent), MONTH(e.TglEvent)
    ORDER BY Tahun DESC, Bulan DESC
  `

  try {
    const result = await loggedQuery(query, [])
    console.log(`[MONTHLY-REVENUE] Found ${result.recordset.length} monthly revenue reports`)
    res.json(result.recordset)
  } catch (err) {
    console.error("[MONTHLY-REVENUE] Database error:", err)
    return res.status(500).json({ error: "Database error" })
  }
})