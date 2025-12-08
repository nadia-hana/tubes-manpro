document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  const token = localStorage.getItem("token")
  const userStr = localStorage.getItem("user")

  if (!token || !userStr) {
    window.location.href = "/"
    return
  }

  const user = JSON.parse(userStr)

  if (user.role !== "asisten") {
    window.location.href = "/"
    return
  }

  // Display user info
  document.getElementById("userInfo").textContent = `Halo, ${user.nama}`

  // Logout handler
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear()
    window.location.href = "/"
  })

  // Tab navigation
  const tabBtns = document.querySelectorAll(".tab-btn")
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")

      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.add("hidden")
      })

      const tabId = btn.dataset.tab + "-tab"
      document.getElementById(tabId).classList.remove("hidden")

      // Load data for the selected tab
      switch (btn.dataset.tab) {
        case "overview":
          loadOverviewData()
          break
        case "clients":
          loadClients()
          break
        case "events":
          loadMyEvents()
          break
        case "calendar":
          loadEventsForCalendar().then(() => renderCalendar())
          break
        case "vendors":
          loadVendors()
          break
        case "reports":
          loadReports()
          break
      }
    })
  })

  // Modal handlers
  document.getElementById("addClientBtn").addEventListener("click", () => {
    document.getElementById("clientModalTitle").textContent = "Tambah Klien Baru"
    document.getElementById("addClientForm").reset()
    document.getElementById("editClientId").value = ""
    document.getElementById("addClientModal").classList.remove("hidden")
  })

  document.getElementById("cancelClientBtn").addEventListener("click", () => {
    document.getElementById("addClientModal").classList.add("hidden")
  })

  document.getElementById("addEventBtn").addEventListener("click", () => {
    document.getElementById("eventModalTitle").textContent = "Tambah Event Baru"
    document.getElementById("addEventForm").reset()
    document.getElementById("editEventId").value = ""
    document.getElementById("addEventModal").classList.remove("hidden")
  })

  document.getElementById("cancelEventBtn").addEventListener("click", () => {
    document.getElementById("addEventModal").classList.add("hidden")
  })

  document.getElementById("closeEventVendorModal").addEventListener("click", () => {
    document.getElementById("eventVendorModal").classList.add("hidden")
  })

  document.getElementById("cancelDealingBtn").addEventListener("click", () => {
    document.getElementById("priceDealingModal").classList.add("hidden")
  })

  document.getElementById("saveDealingBtn").addEventListener("click", handleSaveDealing)

  // Form handlers
  document.getElementById("addClientForm").addEventListener("submit", handleAddClient)
  document.getElementById("addEventForm").addEventListener("submit", handleAddEvent)

  // Event select for budget report
  document.getElementById("eventSelect").addEventListener("change", loadBudgetReport)

  // Vendor filter
  document.getElementById("vendorFilter").addEventListener("change", filterVendors)
  document.getElementById("vendorTypeFilter").addEventListener("change", filterAvailableVendors)

  // Calendar navigation
  document.getElementById("prevMonth").addEventListener("click", () => {
    currentMonth--
    if (currentMonth < 0) {
      currentMonth = 11
      currentYear--
    }
    renderCalendar()
  })

  document.getElementById("nextMonth").addEventListener("click", () => {
    currentMonth++
    if (currentMonth > 11) {
      currentMonth = 0
      currentYear++
    }
    renderCalendar()
  })

  // Load initial data
  await loadDropdownData()
  await loadOverviewData()

  // Variables for calendar
  let currentMonth = new Date().getMonth()
  let currentYear = new Date().getFullYear()
  let eventsData = []

  // Variables for event vendor management
  let currentEventId = null
  let currentEventBudget = 0
  let selectedVendors = []
  let availableVendors = []
  let currentDealingVendor = null

  // API Helper
  async function apiCall(endpoint, options = {}) {
    const response = await fetch(`http://localhost:3000/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  // Notification
  function showNotification(message, type = "success") {
    const notification = document.getElementById("notification")
    const notificationMessage = document.getElementById("notificationMessage")

    notificationMessage.textContent = message
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`

    notification.classList.remove("hidden")

    setTimeout(() => {
      notification.classList.add("hidden")
    }, 3000)
  }

  // FK Warning Modal
  function showFKConstraintWarning(title, message, details) {
    document.getElementById("fkWarningTitle").textContent = title
    document.getElementById("fkWarningMessage").textContent = message
    document.getElementById("fkWarningDetails").textContent = details
    document.getElementById("fkWarningModal").classList.remove("hidden")
  }

  // Format helpers
  function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Calendar functions
  async function loadEventsForCalendar() {
    try {
      eventsData = await apiCall("/events")
    } catch (error) {
      console.error("Error loading events for calendar:", error)
    }
  }

  function renderCalendar() {
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ]

    document.getElementById("currentMonth").textContent = `${monthNames[currentMonth]} ${currentYear}`

    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    let calendarHTML = `
      <div class="text-center font-semibold text-gray-600 py-2">Min</div>
      <div class="text-center font-semibold text-gray-600 py-2">Sen</div>
      <div class="text-center font-semibold text-gray-600 py-2">Sel</div>
      <div class="text-center font-semibold text-gray-600 py-2">Rab</div>
      <div class="text-center font-semibold text-gray-600 py-2">Kam</div>
      <div class="text-center font-semibold text-gray-600 py-2">Jum</div>
      <div class="text-center font-semibold text-gray-600 py-2">Sab</div>
    `

    for (let i = 0; i < firstDay; i++) {
      calendarHTML += '<div class="p-2"></div>'
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayEvents = eventsData.filter((event) => {
        const eventDate = new Date(event.TglEvent).toISOString().split("T")[0]
        return eventDate === dateStr
      })

      const hasEvents = dayEvents.length > 0
      const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString()

      calendarHTML += `
        <div class="p-2 border border-gray-200 min-h-[60px] cursor-pointer hover:bg-gray-50 ${isToday ? "bg-blue-50" : ""}" 
             onclick="showDayEvents('${dateStr}')">
          <div class="font-medium ${isToday ? "text-blue-600" : ""}">${day}</div>
          ${hasEvents ? `<div class="w-2 h-2 bg-red-500 rounded-full mt-1"></div>` : ""}
          ${hasEvents ? `<div class="text-xs text-gray-500">${dayEvents.length} event</div>` : ""}
        </div>
      `
    }

    document.getElementById("calendar").innerHTML = calendarHTML
  }

  window.showDayEvents = (dateStr) => {
    const dayEvents = eventsData.filter((event) => {
      const eventDate = new Date(event.TglEvent).toISOString().split("T")[0]
      return eventDate === dateStr
    })

    if (dayEvents.length === 0) return

    const eventDetailsHTML = dayEvents
      .map(
        (event) => `
      <div class="border-b pb-4 mb-4 last:border-b-0">
        <h4 class="font-semibold text-lg">${event.Nama}</h4>
        <div class="grid grid-cols-2 gap-4 mt-2 text-sm">
          <div><strong>Klien:</strong> ${event.KlienNama}</div>
          <div><strong>Jenis:</strong> ${event.JenisEventNama}</div>
          <div><strong>Tanggal:</strong> ${formatDate(event.TglEvent)}</div>
          <div><strong>Status:</strong> 
            <span class="px-2 py-1 text-xs rounded-full ${
              event.StatusEvent === "Selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            }">
              ${event.StatusEvent}
            </span>
          </div>
          <div><strong>Budget:</strong> ${formatCurrency(event.BudgetEvent)}</div>
          <div><strong>Undangan:</strong> ${event.JumlahUndangan} orang</div>
        </div>
        ${
          event.StatusEvent !== "Selesai"
            ? `
          <button onclick="completeEvent(${event.IdEvent})" 
                  class="mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm">
            Selesaikan Event
          </button>
        `
            : ""
        }
      </div>
    `,
      )
      .join("")

    document.getElementById("eventDetailContent").innerHTML = eventDetailsHTML
    document.getElementById("eventDetailModal").classList.remove("hidden")
  }

  window.completeEvent = async (eventId) => {
    const button = document.querySelector(`button[onclick="completeEvent(${eventId})"]`)
    const originalText = button.innerHTML

    button.innerHTML =
      '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Memproses...'
    button.disabled = true
    button.classList.add("opacity-75", "cursor-not-allowed")

    try {
      await apiCall(`/events/${eventId}/complete`, { method: "PUT" })

      button.innerHTML = "Berhasil!"
      button.classList.remove("bg-green-500", "hover:bg-green-600")
      button.classList.add("bg-green-600")

      showNotification("Event berhasil diselesaikan")

      setTimeout(async () => {
        document.getElementById("eventDetailModal").classList.add("hidden")
        await loadEventsForCalendar()
        renderCalendar()
        if (!document.getElementById("overview-tab").classList.contains("hidden")) {
          await loadOverviewData()
        }
        if (!document.getElementById("events-tab").classList.contains("hidden")) {
          await loadMyEvents()
        }
        if (!document.getElementById("reports-tab").classList.contains("hidden")) {
          await loadReports()
        }
      }, 1000)
    } catch (error) {
      console.error("Error completing event:", error)
      showNotification("Gagal menyelesaikan event", "error")
      button.innerHTML = originalText
      button.disabled = false
      button.classList.remove("opacity-75", "cursor-not-allowed")
    }
  }

  // Load Overview Data
  async function loadOverviewData() {
    try {
      const events = await apiCall("/events")
      const myEvents = events.filter((event) => event.IdPengguna === user.id)

      const totalEvents = myEvents.length
      const completedEvents = myEvents.filter((event) => event.StatusEvent === "Selesai").length
      const ongoingEvents = myEvents.filter((event) => event.StatusEvent !== "Selesai").length

      document.getElementById("myEvents").textContent = totalEvents
      document.getElementById("completedEvents").textContent = completedEvents
      document.getElementById("ongoingEvents").textContent = ongoingEvents

      const recentEvents = myEvents.slice(0, 5)
      const recentEventsHtml = recentEvents
        .map(
          (event) => `
        <div class="flex justify-between items-center py-2 border-b">
          <div>
            <p class="font-medium">${event.Nama}</p>
            <p class="text-sm text-gray-500">${formatDate(event.TglEvent)} - ${event.KlienNama}</p>
          </div>
          <span class="px-2 py-1 text-xs rounded-full ${
            event.StatusEvent === "Selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          }">
            ${event.StatusEvent}
          </span>
        </div>
      `,
        )
        .join("")

      document.getElementById("myRecentEvents").innerHTML =
        recentEventsHtml || '<p class="text-gray-500">Belum ada event</p>'
    } catch (error) {
      console.error("Error loading overview data:", error)
      showNotification("Gagal memuat data overview", "error")
    }
  }

  // Load Clients
  async function loadClients() {
    try {
      const clients = await apiCall("/clients")
      const clientsHtml = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Telepon</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${clients
              .map(
                (client) => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${client.Nama}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.Email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.NoTelp}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.Alamat}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onclick="editClient(${client.IdKlien})" class="text-primary hover:text-secondary mr-3">Edit</button>
                  <button onclick="deleteClient(${client.IdKlien})" class="text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
      document.getElementById("clientsTable").innerHTML = clientsHtml
    } catch (error) {
      console.error("Error loading clients:", error)
      showNotification("Gagal memuat data klien", "error")
    }
  }

  // Load My Events
  async function loadMyEvents() {
    try {
      const events = await apiCall("/events")
      const eventsHtml = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Event</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klien</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Undangan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${events
              .map(
                (event) => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${event.Nama}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(event.TglEvent)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${event.KlienNama}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${event.JenisEventNama}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${event.JumlahUndangan} orang</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs rounded-full ${
                    event.StatusEvent === "Selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }">
                    ${event.StatusEvent}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(event.BudgetEvent)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex flex-wrap gap-1">
                    <button onclick="openEventVendorModal(${event.IdEvent}, '${event.Nama}', ${event.BudgetEvent})" 
                            class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs">
                      Kelola Vendor
                    </button>
                    ${
                      event.StatusEvent !== "Selesai"
                        ? `
                      <button onclick="editEvent(${event.IdEvent})" 
                              class="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs">
                        Edit
                      </button>
                      <button onclick="completeEvent(${event.IdEvent})" 
                              class="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs">
                        Selesaikan
                      </button>
                      <button onclick="deleteEvent(${event.IdEvent})" 
                              class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs">
                        Hapus
                      </button>
                    `
                        : '<span class="text-green-600 text-xs font-medium">Selesai</span>'
                    }
                  </div>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
      document.getElementById("eventsTable").innerHTML = eventsHtml
    } catch (error) {
      console.error("Error loading events:", error)
      showNotification("Gagal memuat data event", "error")
    }
  }

  // Load Vendors
  async function loadVendors() {
    try {
      const vendors = await apiCall("/vendors")
      displayVendors(vendors)
    } catch (error) {
      console.error("Error loading vendors:", error)
      showNotification("Gagal memuat data vendor", "error")
    }
  }

  function displayVendors(vendors) {
    const vendorsHtml = vendors
      .map(
        (vendor) => `
      <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-semibold text-gray-900">${vendor.Nama}</h4>
          <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">${vendor.JenisVendorNama}</span>
        </div>
        <p class="text-sm text-gray-600 mb-2">Pemilik: ${vendor.NamaPemilik}</p>
        <p class="text-sm text-gray-600 mb-2">Kontak: ${vendor.NoTelp}</p>
        <p class="text-lg font-bold text-primary">${formatCurrency(vendor.Harga)}</p>
        <p class="text-xs text-gray-500 mt-2">${vendor.Alamat}</p>
      </div>
    `,
      )
      .join("")

    document.getElementById("vendorsGrid").innerHTML = vendorsHtml || '<p class="text-gray-500">Tidak ada vendor</p>'
  }

  async function filterVendors() {
    const filterValue = document.getElementById("vendorFilter").value
    try {
      const vendors = await apiCall("/vendors")
      let filteredVendors = vendors

      if (filterValue && filterValue !== "") {
        filteredVendors = vendors.filter((vendor) => vendor.IdJenisVendor.toString() === filterValue.toString())
      }

      displayVendors(filteredVendors)
    } catch (error) {
      console.error("Error filtering vendors:", error)
      showNotification("Gagal memfilter vendor", "error")
    }
  }

  // Load Reports
  async function loadReports() {
    try {
      const events = await apiCall("/events")
      const myEvents = events.filter((event) => event.IdPengguna === user.id)

      // Load events for budget report dropdown
      const eventSelect = document.getElementById("eventSelect")
      eventSelect.innerHTML =
        '<option value="">Pilih Event untuk Melihat Detail Budget</option>' +
        myEvents
          .map((event) => `<option value="${event.IdEvent}">${event.Nama} - ${formatDate(event.TglEvent)}</option>`)
          .join("")

      // Separate ongoing and completed events
      const ongoingEvents = myEvents.filter((event) => event.StatusEvent !== "Selesai")
      const completedEvents = myEvents.filter((event) => event.StatusEvent === "Selesai")

      // Display ongoing events (belum dilaksanakan)
      const ongoingEventsHtml =
        ongoingEvents.length > 0
          ? `
        <div class="space-y-3">
          ${ongoingEvents
            .map(
              (event) => `
            <div class="flex justify-between items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">${event.Nama}</p>
                <p class="text-sm text-gray-600">${formatDate(event.TglEvent)} - ${event.KlienNama}</p>
                <p class="text-sm text-gray-500">Jenis: ${event.JenisEventNama} | Undangan: ${event.JumlahUndangan} orang</p>
              </div>
              <div class="text-right">
                <p class="font-medium text-gray-900">${formatCurrency(event.BudgetEvent)}</p>
                <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                  ${event.StatusEvent}
                </span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : '<p class="text-gray-500">Tidak ada event yang sedang ditangani</p>'

      document.getElementById("ongoingEventsReport").innerHTML = ongoingEventsHtml

      // Display completed events (sudah selesai)
      const completedEventsHtml =
        completedEvents.length > 0
          ? `
        <div class="space-y-3">
          ${completedEvents
            .map(
              (event) => `
            <div class="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">${event.Nama}</p>
                <p class="text-sm text-gray-600">${formatDate(event.TglEvent)} - ${event.KlienNama}</p>
                <p class="text-sm text-gray-500">Jenis: ${event.JenisEventNama} | Undangan: ${event.JumlahUndangan} orang</p>
              </div>
              <div class="text-right">
                <p class="font-medium text-gray-900">${formatCurrency(event.BudgetEvent)}</p>
                <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Selesai
                </span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : '<p class="text-gray-500">Belum ada event yang selesai</p>'

      document.getElementById("completedEventsReport").innerHTML = completedEventsHtml
    } catch (error) {
      console.error("Error loading reports:", error)
      showNotification("Gagal memuat laporan", "error")
    }
  }

  // Load Budget Report
  async function loadBudgetReport() {
    const eventId = document.getElementById("eventSelect").value
    if (!eventId) {
      document.getElementById("budgetReport").innerHTML =
        '<p class="text-gray-500">Pilih event untuk melihat rincian budget dan perkiraan total biaya</p>'
      return
    }

    try {
      const budgetData = await apiCall(`/events/${eventId}/budget`)
      const eventData = eventsData.find((e) => e.IdEvent == eventId) || (await apiCall(`/events/${eventId}`))

      if (budgetData.length === 0) {
        document.getElementById("budgetReport").innerHTML = `
          <div class="p-4 bg-gray-50 rounded-lg mb-4">
            <p class="font-medium">Budget Event: ${formatCurrency(eventData?.BudgetEvent || 0)}</p>
          </div>
          <p class="text-gray-500">Belum ada vendor yang dipilih untuk event ini. Silakan kelola vendor melalui menu Manajemen Event.</p>
        `
        return
      }

      const totalCost = budgetData.reduce((sum, item) => sum + Number.parseFloat(item.HargaDealing || 0), 0)
      const eventBudget = eventData?.BudgetEvent || 0
      const remaining = eventBudget - totalCost

      const budgetHtml = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-600 font-medium">Budget Event</p>
              <p class="text-xl font-bold text-blue-900">${formatCurrency(eventBudget)}</p>
            </div>
            <div class="p-4 bg-yellow-50 rounded-lg">
              <p class="text-sm text-yellow-600 font-medium">Total Biaya Vendor</p>
              <p class="text-xl font-bold text-yellow-900">${formatCurrency(totalCost)}</p>
            </div>
            <div class="p-4 ${remaining >= 0 ? "bg-green-50" : "bg-red-50"} rounded-lg">
              <p class="text-sm ${remaining >= 0 ? "text-green-600" : "text-red-600"} font-medium">Sisa Budget</p>
              <p class="text-xl font-bold ${remaining >= 0 ? "text-green-900" : "text-red-900"}">${formatCurrency(remaining)}</p>
            </div>
          </div>
          
          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-900 mb-3">Rincian Biaya Vendor:</h4>
            <div class="space-y-2">
              ${budgetData
                .map(
                  (item, index) => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p class="font-medium">${index + 1}. ${item.VendorNama}</p>
                    <p class="text-sm text-gray-500">${item.JenisVendorNama}</p>
                  </div>
                  <p class="font-medium">${formatCurrency(item.HargaDealing)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          
          <div class="border-t pt-4">
            <div class="flex justify-between items-center text-lg font-bold">
              <span>TOTAL PERKIRAAN BIAYA:</span>
              <span class="text-primary">${formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>
      `

      document.getElementById("budgetReport").innerHTML = budgetHtml
    } catch (error) {
      console.error("Error loading budget report:", error)
      showNotification("Gagal memuat laporan budget", "error")
    }
  }

  // Load Dropdown Data
  async function loadDropdownData() {
    try {
      const [eventTypes, vendorTypes, clients] = await Promise.all([
        apiCall("/event-types"),
        apiCall("/vendor-types"),
        apiCall("/clients"),
      ])

      const eventTypeSelect = document.querySelector('select[name="idJenisEvent"]')
      eventTypeSelect.innerHTML =
        '<option value="">Pilih Jenis Event</option>' +
        eventTypes.map((type) => `<option value="${type.IdJenisEvent}">${type.Nama}</option>`).join("")

      const vendorFilter = document.getElementById("vendorFilter")
      vendorFilter.innerHTML =
        '<option value="">Semua Jenis Vendor</option>' +
        vendorTypes.map((type) => `<option value="${type.IdJenisVendor}">${type.Nama}</option>`).join("")

      const clientSelect = document.querySelector('select[name="idKlien"]')
      clientSelect.innerHTML =
        '<option value="">Pilih Klien</option>' +
        clients.map((client) => `<option value="${client.IdKlien}">${client.Nama}</option>`).join("")
    } catch (error) {
      console.error("Error loading dropdown data:", error)
    }
  }

  // Handle Add/Edit Client
  async function handleAddClient(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const clientId = formData.get("idKlien") || document.getElementById("editClientId").value

    const clientData = {
      nama: formData.get("nama"),
      alamat: formData.get("alamat"),
      noTelp: formData.get("noTelp"),
      email: formData.get("email"),
    }

    try {
      if (clientId) {
        await apiCall(`/clients/${clientId}`, {
          method: "PUT",
          body: JSON.stringify(clientData),
        })
        showNotification("Klien berhasil diupdate")
      } else {
        await apiCall("/clients", {
          method: "POST",
          body: JSON.stringify(clientData),
        })
        showNotification("Klien berhasil ditambahkan")
      }

      document.getElementById("addClientModal").classList.add("hidden")
      e.target.reset()
      loadClients()
      loadDropdownData()
    } catch (error) {
      showNotification("Gagal menyimpan klien", "error")
    }
  }

  // Edit Client
  window.editClient = async (clientId) => {
    try {
      const clients = await apiCall("/clients")
      const client = clients.find((c) => c.IdKlien === clientId)

      if (client) {
        document.getElementById("clientModalTitle").textContent = "Edit Klien"
        document.getElementById("editClientId").value = client.IdKlien
        document.querySelector('input[name="nama"]').value = client.Nama
        document.querySelector('textarea[name="alamat"]').value = client.Alamat
        document.querySelector('input[name="noTelp"]').value = client.NoTelp
        document.querySelector('input[name="email"]').value = client.Email
        document.getElementById("addClientModal").classList.remove("hidden")
      }
    } catch (error) {
      showNotification("Gagal memuat data klien", "error")
    }
  }

  // Handle Add/Edit Event
  async function handleAddEvent(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const eventId = formData.get("idEvent") || document.getElementById("editEventId").value

    const eventData = {
      nama: formData.get("nama"),
      tglEvent: formData.get("tglEvent"),
      jumlahUndangan: Number.parseInt(formData.get("jumlahUndangan")),
      budgetEvent: Number.parseFloat(formData.get("budgetEvent")),
      idJenisEvent: Number.parseInt(formData.get("idJenisEvent")),
      idKlien: Number.parseInt(formData.get("idKlien")),
    }

    try {
      if (eventId) {
        await apiCall(`/events/${eventId}`, {
          method: "PUT",
          body: JSON.stringify(eventData),
        })
        showNotification("Event berhasil diupdate")
      } else {
        await apiCall("/events", {
          method: "POST",
          body: JSON.stringify(eventData),
        })
        showNotification("Event berhasil ditambahkan")
      }

      document.getElementById("addEventModal").classList.add("hidden")
      e.target.reset()
      loadMyEvents()
      loadOverviewData()
      await loadEventsForCalendar()
      renderCalendar()
    } catch (error) {
      showNotification("Gagal menyimpan event", "error")
    }
  }

  // Edit Event
  window.editEvent = async (eventId) => {
    try {
      const events = await apiCall("/events")
      const event = events.find((e) => e.IdEvent === eventId)

      if (event) {
        document.getElementById("eventModalTitle").textContent = "Edit Event"
        document.getElementById("editEventId").value = event.IdEvent
        document.querySelector('#addEventForm input[name="nama"]').value = event.Nama
        document.querySelector('#addEventForm input[name="tglEvent"]').value = new Date(event.TglEvent)
          .toISOString()
          .split("T")[0]
        document.querySelector('#addEventForm input[name="jumlahUndangan"]').value = event.JumlahUndangan
        document.querySelector('#addEventForm input[name="budgetEvent"]').value = event.BudgetEvent
        document.querySelector('#addEventForm select[name="idJenisEvent"]').value = event.IdJenisEvent
        document.querySelector('#addEventForm select[name="idKlien"]').value = event.IdKlien
        document.getElementById("addEventModal").classList.remove("hidden")
      }
    } catch (error) {
      showNotification("Gagal memuat data event", "error")
    }
  }

  // Event Vendor Management
  window.openEventVendorModal = async (eventId, eventName, eventBudget) => {
    currentEventId = eventId
    currentEventBudget = eventBudget

    document.getElementById("eventVendorTitle").textContent = `Event: ${eventName}`
    document.getElementById("eventVendorBudget").textContent = `Budget: ${formatCurrency(eventBudget)}`

    await loadEventVendors()
    await loadAvailableVendors()

    document.getElementById("eventVendorModal").classList.remove("hidden")
  }

  async function loadEventVendors() {
    try {
      const eventVendors = await apiCall(`/events/${currentEventId}/budget`)
      selectedVendors = eventVendors
      displaySelectedVendors()
      updateBudgetSummary()
    } catch (error) {
      console.error("Error loading event vendors:", error)
      selectedVendors = []
      displaySelectedVendors()
    }
  }

  async function loadAvailableVendors() {
    try {
      const vendors = await apiCall("/vendors")
      availableVendors = vendors.filter(
        (vendor) => !selectedVendors.some((selected) => selected.IdVendor === vendor.IdVendor),
      )
      displayAvailableVendors()

      const vendorTypes = await apiCall("/vendor-types")
      const vendorTypeFilter = document.getElementById("vendorTypeFilter")
      vendorTypeFilter.innerHTML =
        '<option value="">Semua Jenis Vendor</option>' +
        vendorTypes.map((type) => `<option value="${type.IdJenisVendor}">${type.Nama}</option>`).join("")
    } catch (error) {
      console.error("Error loading available vendors:", error)
    }
  }

  function displayAvailableVendors() {
    const vendorsHtml = availableVendors
      .map(
        (vendor) => `
      <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
        <div class="flex justify-between items-start mb-2">
          <h5 class="font-medium text-gray-900">${vendor.Nama}</h5>
          <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">${vendor.JenisVendorNama}</span>
        </div>
        <p class="text-sm text-gray-600 mb-1">Pemilik: ${vendor.NamaPemilik}</p>
        <p class="text-sm font-medium text-gray-900 mb-2">Harga: ${formatCurrency(vendor.Harga)}</p>
        <button onclick="openPriceDealingModal(${vendor.IdVendor})" 
                class="w-full bg-primary text-white px-3 py-1 rounded text-sm hover:bg-secondary">
          Pilih & Negosiasi Harga
        </button>
      </div>
    `,
      )
      .join("")

    document.getElementById("availableVendors").innerHTML =
      vendorsHtml || '<p class="text-gray-500 text-sm">Tidak ada vendor tersedia</p>'
  }

  function displaySelectedVendors() {
    const vendorsHtml = selectedVendors
      .map(
        (vendor) => `
      <div class="border border-green-200 rounded-lg p-3 bg-green-50">
        <div class="flex justify-between items-start mb-2">
          <h5 class="font-medium text-gray-900">${vendor.VendorNama}</h5>
          <button onclick="removeVendorFromEvent(${vendor.IdVendor})" 
                  class="text-red-500 hover:text-red-700 text-sm">
            Hapus
          </button>
        </div>
        <p class="text-sm text-gray-600 mb-1">Jenis: ${vendor.JenisVendorNama}</p>
        <p class="text-sm font-bold text-green-700">Harga Deal: ${formatCurrency(vendor.HargaDealing || 0)}</p>
        <button onclick="editVendorPrice(${vendor.IdVendor})" 
                class="mt-2 text-primary hover:text-secondary text-sm font-medium">
          Edit Harga Dealing
        </button>
      </div>
    `,
      )
      .join("")

    document.getElementById("selectedVendors").innerHTML =
      vendorsHtml || '<p class="text-gray-500 text-sm">Belum ada vendor dipilih</p>'
  }

  function updateBudgetSummary() {
    const totalCost = selectedVendors.reduce((sum, vendor) => {
      return sum + (Number.parseFloat(vendor.HargaDealing) || 0)
    }, 0)
    const remaining = currentEventBudget - totalCost

    document.getElementById("totalVendorCost").textContent = formatCurrency(totalCost)
    document.getElementById("remainingBudget").textContent = formatCurrency(remaining)
    document.getElementById("remainingBudget").className =
      `font-medium ${remaining >= 0 ? "text-green-600" : "text-red-600"}`
  }

  function filterAvailableVendors() {
    const filterValue = document.getElementById("vendorTypeFilter").value
    if (!filterValue || filterValue === "") {
      displayAvailableVendors()
      return
    }

    const filtered = availableVendors.filter((vendor) => vendor.IdJenisVendor.toString() === filterValue.toString())

    const vendorsHtml = filtered
      .map(
        (vendor) => `
      <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
        <div class="flex justify-between items-start mb-2">
          <h5 class="font-medium text-gray-900">${vendor.Nama}</h5>
          <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">${vendor.JenisVendorNama}</span>
        </div>
        <p class="text-sm text-gray-600 mb-1">Pemilik: ${vendor.NamaPemilik}</p>
        <p class="text-sm font-medium text-gray-900 mb-2">Harga: ${formatCurrency(vendor.Harga)}</p>
        <button onclick="openPriceDealingModal(${vendor.IdVendor})" 
                class="w-full bg-primary text-white px-3 py-1 rounded text-sm hover:bg-secondary">
          Pilih & Negosiasi Harga
        </button>
      </div>
    `,
      )
      .join("")

    document.getElementById("availableVendors").innerHTML =
      vendorsHtml || '<p class="text-gray-500 text-sm">Tidak ada vendor tersedia untuk jenis ini</p>'
  }

  window.openPriceDealingModal = (vendorId) => {
    const vendor = availableVendors.find((v) => v.IdVendor === vendorId)
    if (!vendor) return

    currentDealingVendor = vendor
    document.getElementById("dealingVendorName").textContent = `Vendor: ${vendor.Nama}`
    document.getElementById("dealingVendorType").textContent = `Jenis: ${vendor.JenisVendorNama}`
    document.getElementById("dealingVendorBasePrice").textContent = `Harga Dasar: ${formatCurrency(vendor.Harga)}`
    document.getElementById("dealingPrice").value = vendor.Harga || 0

    document.getElementById("priceDealingModal").classList.remove("hidden")
  }

  window.editVendorPrice = (vendorId) => {
    const vendor = selectedVendors.find((v) => v.IdVendor === vendorId)
    if (!vendor) return

    currentDealingVendor = vendor
    document.getElementById("dealingVendorName").textContent = `Vendor: ${vendor.VendorNama}`
    document.getElementById("dealingVendorType").textContent = `Jenis: ${vendor.JenisVendorNama}`
    document.getElementById("dealingVendorBasePrice").textContent =
      `Harga Dealing Saat Ini: ${formatCurrency(vendor.HargaDealing)}`
    document.getElementById("dealingPrice").value = vendor.HargaDealing || 0

    document.getElementById("priceDealingModal").classList.remove("hidden")
  }

  async function handleSaveDealing() {
    const dealingPrice = Number.parseFloat(document.getElementById("dealingPrice").value)
    if (!dealingPrice || dealingPrice <= 0) {
      showNotification("Masukkan harga yang valid", "error")
      return
    }

    try {
      await apiCall(`/events/${currentEventId}/vendors`, {
        method: "POST",
        body: JSON.stringify({
          idVendor: currentDealingVendor.IdVendor,
          hargaDealing: dealingPrice,
        }),
      })

      showNotification("Vendor berhasil ditambahkan/diupdate")
      document.getElementById("priceDealingModal").classList.add("hidden")

      await loadEventVendors()
      await loadAvailableVendors()
    } catch (error) {
      console.error("Error saving vendor dealing:", error)
      showNotification("Gagal menyimpan vendor", "error")
    }
  }

  window.removeVendorFromEvent = async (vendorId) => {
    if (!confirm("Yakin ingin menghapus vendor ini dari event?")) return

    try {
      await apiCall(`/events/${currentEventId}/vendors/${vendorId}`, {
        method: "DELETE",
      })

      showNotification("Vendor berhasil dihapus")
      await loadEventVendors()
      await loadAvailableVendors()
    } catch (error) {
      console.error("Error removing vendor:", error)
      showNotification("Gagal menghapus vendor", "error")
    }
  }

  // Delete Client
  window.deleteClient = async (clientId) => {
    if (!confirm("Yakin ingin menghapus klien ini?")) return

    const button = document.querySelector(`button[onclick="deleteClient(${clientId})"]`)
    let originalText = ""
    if (button) {
      originalText = button.innerHTML
      button.innerHTML =
        '<span class="animate-spin inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full"></span>'
      button.disabled = true
    }

    try {
      await apiCall(`/clients/${clientId}`, { method: "DELETE" })
      showNotification("Klien berhasil dihapus")
      loadClients()
      loadDropdownData()
    } catch (error) {
      console.error("Error deleting client:", error)

      if (error.constraint === "foreign_key") {
        showFKConstraintWarning("Tidak Dapat Menghapus Klien", error.error, error.details)
      } else {
        showNotification("Gagal menghapus klien", "error")
      }

      if (button) {
        button.innerHTML = originalText
        button.disabled = false
      }
    }
  }

  // Delete Event
  window.deleteEvent = async (eventId) => {
    if (!confirm("Yakin ingin menghapus event ini?")) return

    const button = document.querySelector(`button[onclick="deleteEvent(${eventId})"]`)
    let originalText = ""
    if (button) {
      originalText = button.innerHTML
      button.innerHTML =
        '<span class="animate-spin inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full"></span>'
      button.disabled = true
    }

    try {
      await apiCall(`/events/${eventId}`, { method: "DELETE" })
      showNotification("Event berhasil dihapus")
      loadMyEvents()
      loadOverviewData()
      await loadEventsForCalendar()
      renderCalendar()
    } catch (error) {
      console.error("Error deleting event:", error)

      if (error.constraint === "foreign_key") {
        showFKConstraintWarning("Tidak Dapat Menghapus Event", error.error, error.details)
      } else {
        showNotification("Gagal menghapus event", "error")
      }

      if (button) {
        button.innerHTML = originalText
        button.disabled = false
      }
    }
  }
})
