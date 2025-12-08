document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  const token = localStorage.getItem("token")
  const userStr = localStorage.getItem("user")

  if (!token || !userStr) {
    window.location.href = "/"
    return
  }

  let user
  try {
    user = JSON.parse(userStr)
  } catch (error) {
    localStorage.clear()
    window.location.href = "/"
    return
  }

  if (user.role !== "pemilik_usaha") {
    window.location.href = "/"
    return
  }

  const currentDate = new Date()
  let currentMonth = currentDate.getMonth()
  let currentYear = currentDate.getFullYear()
  let eventsData = []

  async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem("token")

    const config = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`http://localhost:3000/api${endpoint}`, config)

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear()
        window.location.href = "/"
        return
      }
      const errorData = await response.json()
      throw errorData
    }

    return response.json()
  }

  function logout() {
    localStorage.clear()
    window.location.href = "/"
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
      amount,
    )
  }

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  // Initialize dashboard
  init()

  async function init() {
    displayUserInfo()
    setupEventListeners()
    await loadOverviewData()
    await loadVendorTypes()
    await loadEventsForCalendar()
  }

  function displayUserInfo() {
    document.getElementById("userInfo").textContent = `Selamat datang, ${user.nama}`
  }

  function setupEventListeners() {
    document.getElementById("logoutBtn").addEventListener("click", logout)

    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab
        switchTab(tabName)
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
      })
    })

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

    document.getElementById("closeEventDetail").addEventListener("click", () => {
      document.getElementById("eventDetailModal").classList.add("hidden")
    })

    // Employee Modal controls
    document.getElementById("addEmployeeBtn").addEventListener("click", () => {
      document.getElementById("employeeModalTitle").textContent = "Tambah Asisten Baru"
      document.getElementById("submitEmployeeBtn").textContent = "Tambah Asisten"
      document.getElementById("addEmployeeForm").reset()
      delete document.getElementById("addEmployeeForm").dataset.editId
      document.getElementById("passwordField").style.display = "block"
      document.querySelector('input[name="password"]').required = true
      document.getElementById("addEmployeeModal").classList.remove("hidden")
    })

    document.getElementById("cancelEmployeeBtn").addEventListener("click", () => {
      document.getElementById("addEmployeeModal").classList.add("hidden")
      document.getElementById("addEmployeeForm").reset()
      delete document.getElementById("addEmployeeForm").dataset.editId
    })

    // Vendor Modal controls
    document.getElementById("addVendorBtn").addEventListener("click", () => {
      document.getElementById("vendorModalTitle").textContent = "Tambah Vendor Baru"
      document.getElementById("submitVendorBtn").textContent = "Simpan"
      document.getElementById("addVendorForm").reset()
      delete document.getElementById("addVendorForm").dataset.editId
      document.getElementById("addVendorModal").classList.remove("hidden")
    })

    document.getElementById("cancelVendorBtn").addEventListener("click", () => {
      document.getElementById("addVendorModal").classList.add("hidden")
      document.getElementById("addVendorForm").reset()
      delete document.getElementById("addVendorForm").dataset.editId
    })

    document.getElementById("addVendorTypeBtn").addEventListener("click", () => {
      document.getElementById("vendorTypeModalTitle").textContent = "Tambah Jenis Vendor Baru"
      document.getElementById("submitVendorTypeBtn").textContent = "Simpan"
      document.getElementById("addVendorTypeForm").reset()
      delete document.getElementById("addVendorTypeForm").dataset.editId
      document.getElementById("addVendorTypeModal").classList.remove("hidden")
    })

    document.getElementById("cancelVendorTypeBtn").addEventListener("click", () => {
      document.getElementById("addVendorTypeModal").classList.add("hidden")
      document.getElementById("addVendorTypeForm").reset()
      delete document.getElementById("addVendorTypeForm").dataset.editId
    })

    // Form submissions
    document.getElementById("addEmployeeForm").addEventListener("submit", handleAddEmployee)
    document.getElementById("addVendorForm").addEventListener("submit", handleAddVendor)
    document.getElementById("addVendorTypeForm").addEventListener("submit", handleAddVendorType)
  }

  function switchTab(tabName) {
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.add("hidden"))
    document.getElementById(`${tabName}-tab`).classList.remove("hidden")

    switch (tabName) {
      case "employees":
        loadEmployees()
        break
      case "vendors":
        loadVendors()
        break
      case "vendorTypes":
        loadVendorTypesList()
        break
      case "events":
        loadEvents()
        break
      case "calendar":
        renderCalendar()
        break
      case "reports":
        loadReports()
        break
    }
  }

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
          <div><strong>Asisten:</strong> ${event.PenggunaNama}</div>
          <div><strong>Tanggal:</strong> ${formatDate(event.TglEvent)}</div>
          <div><strong>Status:</strong> 
            <span class="px-2 py-1 text-xs rounded-full ${event.StatusEvent === "Selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}">
              ${event.StatusEvent}
            </span>
          </div>
          <div><strong>Budget:</strong> ${formatCurrency(event.BudgetEvent)}</div>
          <div><strong>Jumlah Undangan:</strong> ${event.JumlahUndangan}</div>
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
          await loadEvents()
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

  async function loadOverviewData() {
    try {
      const [events, vendors, clients, assistants] = await Promise.all([
        apiCall("/events"),
        apiCall("/vendors"),
        apiCall("/clients"),
        apiCall("/users"),
      ])

      document.getElementById("totalEvents").textContent = events.length
      document.getElementById("totalVendors").textContent = vendors.length
      document.getElementById("totalClients").textContent = clients.length
      document.getElementById("totalAssistants").textContent = assistants.filter((u) => u.Role === "asisten").length

      const recentEvents = events.slice(0, 5)
      const recentEventsHtml = recentEvents
        .map(
          (event) => `
        <div class="flex justify-between items-center py-2 border-b">
          <div>
            <p class="font-medium">${event.Nama}</p>
            <p class="text-sm text-gray-500">${formatDate(event.TglEvent)} - ${event.KlienNama}</p>
          </div>
          <span class="px-2 py-1 text-xs rounded-full ${event.StatusEvent === "Selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}">
            ${event.StatusEvent}
          </span>
        </div>
      `,
        )
        .join("")

      document.getElementById("recentEvents").innerHTML =
        recentEventsHtml || '<p class="text-gray-500">Tidak ada event terbaru</p>'
    } catch (error) {
      console.error("Error loading overview data:", error)
      showNotification("Gagal memuat data overview", "error")
    }
  }

  async function loadVendorTypes() {
    try {
      const vendorTypes = await apiCall("/vendor-types")
      const vendorTypeSelect = document.querySelector('select[name="idJenisVendor"]')
      if (vendorTypeSelect) {
        vendorTypeSelect.innerHTML =
          '<option value="">Pilih Jenis Vendor</option>' +
          vendorTypes.map((type) => `<option value="${type.IdJenisVendor}">${type.Nama}</option>`).join("")
      }
    } catch (error) {
      console.error("Error loading vendor types:", error)
    }
  }

  async function loadVendorTypesList() {
    try {
      const vendorTypes = await apiCall("/vendor-types")
      const html = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Jenis Vendor</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${vendorTypes
              .map(
                (type) => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${type.IdJenisVendor}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${type.Nama}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onclick="editVendorType(${type.IdJenisVendor}, '${type.Nama}')" class="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onclick="deleteVendorType(${type.IdJenisVendor})" class="text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
      document.getElementById("vendorTypesTable").innerHTML = html
    } catch (error) {
      console.error("Error loading vendor types:", error)
      showNotification("Gagal memuat jenis vendor", "error")
    }
  }

  async function handleAddEmployee(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const editId = e.target.dataset.editId

    const employeeData = {
      nama: formData.get("nama"),
      alamat: formData.get("alamat"),
      noTelp: formData.get("noTelp"),
      username: formData.get("username"),
      password: formData.get("password"),
    }

    try {
      if (editId) {
        await apiCall(`/users/${editId}`, {
          method: "PUT",
          body: JSON.stringify(employeeData),
        })
        showNotification("Asisten berhasil diperbarui")
      } else {
        await apiCall("/users", {
          method: "POST",
          body: JSON.stringify(employeeData),
        })
        showNotification("Asisten berhasil ditambahkan")
      }

      document.getElementById("addEmployeeModal").classList.add("hidden")
      e.target.reset()
      delete e.target.dataset.editId
      loadEmployees()
      loadOverviewData()
    } catch (error) {
      console.error("Error saving employee:", error)
      showNotification(error.error || "Gagal menyimpan asisten", "error")
    }
  }

  async function handleAddVendor(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const editId = e.target.dataset.editId

    const vendorData = {
      nama: formData.get("nama"),
      namaPemilik: formData.get("namaPemilik"),
      alamat: formData.get("alamat"),
      noTelp: formData.get("noTelp"),
      harga: Number.parseFloat(formData.get("harga")),
      idJenisVendor: Number.parseInt(formData.get("idJenisVendor")),
    }

    try {
      if (editId) {
        await apiCall(`/vendors/${editId}`, {
          method: "PUT",
          body: JSON.stringify(vendorData),
        })
        showNotification("Vendor berhasil diperbarui")
      } else {
        await apiCall("/vendors", {
          method: "POST",
          body: JSON.stringify(vendorData),
        })
        showNotification("Vendor berhasil ditambahkan")
      }

      document.getElementById("addVendorModal").classList.add("hidden")
      e.target.reset()
      delete e.target.dataset.editId
      loadVendors()
      loadOverviewData()
    } catch (error) {
      console.error("Error saving vendor:", error)
      showNotification(error.error || "Gagal menyimpan vendor", "error")
    }
  }

  async function handleAddVendorType(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const editId = e.target.dataset.editId

    const data = { nama: formData.get("nama") }

    try {
      if (editId) {
        await apiCall(`/vendor-types/${editId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        })
        showNotification("Jenis vendor berhasil diperbarui")
      } else {
        await apiCall("/vendor-types", {
          method: "POST",
          body: JSON.stringify(data),
        })
        showNotification("Jenis vendor berhasil ditambahkan")
      }

      document.getElementById("addVendorTypeModal").classList.add("hidden")
      e.target.reset()
      delete e.target.dataset.editId
      loadVendorTypesList()
      loadVendorTypes()
    } catch (error) {
      console.error("Error saving vendor type:", error)
      showNotification(error.error || "Gagal menyimpan jenis vendor", "error")
    }
  }

  async function loadEmployees() {
    try {
      const users = await apiCall("/users")
      const assistants = users.filter((user) => user.Role === "asisten")

      const html = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Telepon</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${assistants
              .map(
                (assistant) => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${assistant.Nama}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${assistant.Alamat || "-"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${assistant.NoTelp || "-"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${assistant.Username}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onclick="editEmployee(${assistant.IdPengguna})" class="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onclick="deleteEmployee(${assistant.IdPengguna})" class="text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
      document.getElementById("employeesTable").innerHTML = html
    } catch (error) {
      console.error("Error loading employees:", error)
      showNotification("Gagal memuat data asisten", "error")
    }
  }

  async function loadVendors() {
    try {
      const vendors = await apiCall("/vendors")
      const html = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemilik</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Dasar</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${vendors
              .map(
                (vendor) => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${vendor.Nama}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vendor.NamaPemilik}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vendor.Alamat || "-"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vendor.JenisVendorNama || "-"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(vendor.Harga)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vendor.NoTelp}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onclick="editVendor(${vendor.IdVendor})" class="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button onclick="deleteVendor(${vendor.IdVendor})" class="text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
      document.getElementById("vendorsTable").innerHTML = html
    } catch (error) {
      console.error("Error loading vendors:", error)
      showNotification("Gagal memuat data vendor", "error")
    }
  }

  async function loadEvents() {
    try {
      const events = await apiCall("/events")
      const html = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Event</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klien</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asisten</th>
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${event.PenggunaNama}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs rounded-full ${event.StatusEvent === "Selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}">
                    ${event.StatusEvent}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(event.BudgetEvent)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${
                    event.StatusEvent !== "Selesai"
                      ? `
                    <button onclick="completeEvent(${event.IdEvent})" class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs">
                      Selesaikan
                    </button>
                  `
                      : '<span class="text-green-600">Selesai</span>'
                  }
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
      document.getElementById("eventsTable").innerHTML = html
    } catch (error) {
      console.error("Error loading events:", error)
      showNotification("Gagal memuat data event", "error")
    }
  }

  async function loadReports() {
    // Load vendor usage stats
    loadVendorUsageReport()
    // Load upcoming events report
    loadUpcomingEventsReport()
    // Load past events report
    loadPastEventsReport()
  }

  async function loadVendorUsageReport() {
    const container = document.getElementById("vendorReport")
    container.innerHTML =
      '<div class="text-center py-4"><div class="animate-spin inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>'

    try {
      const vendorStats = await apiCall("/vendor-usage-stats")

      if (vendorStats && vendorStats.length > 0) {
        container.innerHTML = `
          <div class="space-y-3">
            ${vendorStats
              .map(
                (vendor, index) => `
              <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    ${index + 1}
                  </div>
                  <div>
                    <span class="font-medium text-gray-900">${vendor.VendorNama}</span>
                    <div class="text-sm text-gray-500">${vendor.JenisVendor || "-"}</div>
                    ${vendor.RataRataHarga ? `<div class="text-xs text-gray-400">Rata-rata: ${formatCurrency(vendor.RataRataHarga)}</div>` : ""}
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xl font-bold text-blue-600">${vendor.JumlahPenggunaan}</span>
                  <div class="text-sm text-gray-500">kali digunakan</div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `
      } else {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada data vendor yang digunakan</p>'
      }
    } catch (error) {
      console.error("Error loading vendor report:", error)
      container.innerHTML = '<p class="text-red-500 text-center py-4">Gagal memuat laporan vendor</p>'
    }
  }

  async function loadUpcomingEventsReport() {
    const container = document.getElementById("upcomingEventsReport")
    container.innerHTML =
      '<div class="text-center py-4"><div class="animate-spin inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>'

    try {
      const events = await apiCall("/events")
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcomingEvents = events
        .filter((e) => new Date(e.TglEvent) >= today && e.StatusEvent !== "Selesai")
        .sort((a, b) => new Date(a.TglEvent) - new Date(b.TglEvent))
        .slice(0, 10)

      if (upcomingEvents.length > 0) {
        container.innerHTML = `
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Event</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Klien</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asisten</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${upcomingEvents
                .map(
                  (event) => `
                <tr>
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">${event.Nama}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${formatDate(event.TglEvent)}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${event.KlienNama}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${event.PenggunaNama}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${formatCurrency(event.BudgetEvent)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
      } else {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Tidak ada event terdekat</p>'
      }
    } catch (error) {
      console.error("Error loading upcoming events:", error)
      container.innerHTML = '<p class="text-red-500 text-center py-4">Gagal memuat laporan event terdekat</p>'
    }
  }

  async function loadPastEventsReport() {
    const container = document.getElementById("pastEventsReport")
    container.innerHTML =
      '<div class="text-center py-4"><div class="animate-spin inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>'

    try {
      const events = await apiCall("/events")
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const pastEvents = events
        .filter((e) => new Date(e.TglEvent) < today || e.StatusEvent === "Selesai")
        .sort((a, b) => new Date(b.TglEvent) - new Date(a.TglEvent))
        .slice(0, 10)

      if (pastEvents.length > 0) {
        container.innerHTML = `
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Event</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Klien</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asisten</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${pastEvents
                .map(
                  (event) => `
                <tr>
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">${event.Nama}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${formatDate(event.TglEvent)}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${event.KlienNama}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">${event.PenggunaNama}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded-full ${event.StatusEvent === "Selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}">
                      ${event.StatusEvent}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-500">${formatCurrency(event.BudgetEvent)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
      } else {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Tidak ada event yang telah lewat</p>'
      }
    } catch (error) {
      console.error("Error loading past events:", error)
      container.innerHTML = '<p class="text-red-500 text-center py-4">Gagal memuat laporan event yang telah lewat</p>'
    }
  }

  window.editEmployee = async (employeeId) => {
    try {
      const users = await apiCall("/users")
      const employee = users.find((u) => u.IdPengguna === employeeId)

      if (employee) {
        document.getElementById("employeeModalTitle").textContent = "Edit Asisten"
        document.getElementById("submitEmployeeBtn").textContent = "Simpan Perubahan"
        document.querySelector('#addEmployeeForm input[name="nama"]').value = employee.Nama
        document.querySelector('#addEmployeeForm textarea[name="alamat"]').value = employee.Alamat || ""
        document.querySelector('#addEmployeeForm input[name="noTelp"]').value = employee.NoTelp || ""
        document.querySelector('#addEmployeeForm input[name="username"]').value = employee.Username
        document.querySelector('#addEmployeeForm input[name="password"]').value = ""
        document.getElementById("passwordField").style.display = "block"
        document.querySelector('input[name="password"]').required = false
        document.getElementById("addEmployeeForm").dataset.editId = employeeId
        document.getElementById("addEmployeeModal").classList.remove("hidden")
      }
    } catch (error) {
      console.error("Error loading employee:", error)
      showNotification("Gagal memuat data asisten", "error")
    }
  }

  window.deleteEmployee = async (employeeId) => {
    if (!confirm("Yakin ingin menghapus asisten ini?")) return

    try {
      await apiCall(`/users/${employeeId}`, { method: "DELETE" })
      showNotification("Asisten berhasil dihapus")
      loadEmployees()
      loadOverviewData()
    } catch (error) {
      console.error("Error deleting employee:", error)
      if (error.constraint === "foreign_key") {
        showFKConstraintWarning("Tidak Dapat Menghapus Asisten", error.error, error.details)
      } else {
        showNotification(error.error || "Gagal menghapus asisten", "error")
      }
    }
  }

  window.editVendor = async (vendorId) => {
    try {
      const vendors = await apiCall("/vendors")
      const vendor = vendors.find((v) => v.IdVendor === vendorId)

      if (vendor) {
        document.getElementById("vendorModalTitle").textContent = "Edit Vendor"
        document.getElementById("submitVendorBtn").textContent = "Simpan Perubahan"
        document.querySelector('#addVendorForm input[name="nama"]').value = vendor.Nama
        document.querySelector('#addVendorForm input[name="namaPemilik"]').value = vendor.NamaPemilik
        document.querySelector('#addVendorForm textarea[name="alamat"]').value = vendor.Alamat
        document.querySelector('#addVendorForm input[name="noTelp"]').value = vendor.NoTelp
        document.querySelector('#addVendorForm input[name="harga"]').value = vendor.Harga
        document.querySelector('#addVendorForm select[name="idJenisVendor"]').value = vendor.IdJenisVendor
        document.getElementById("addVendorForm").dataset.editId = vendorId
        document.getElementById("addVendorModal").classList.remove("hidden")
      }
    } catch (error) {
      console.error("Error loading vendor:", error)
      showNotification("Gagal memuat data vendor", "error")
    }
  }

  window.deleteVendor = async (vendorId) => {
    if (!confirm("Yakin ingin menghapus vendor ini?")) return

    try {
      await apiCall(`/vendors/${vendorId}`, { method: "DELETE" })
      showNotification("Vendor berhasil dihapus")
      loadVendors()
      loadOverviewData()
    } catch (error) {
      console.error("Error deleting vendor:", error)
      if (error.constraint === "foreign_key") {
        showFKConstraintWarning("Tidak Dapat Menghapus Vendor", error.error, error.details)
      } else {
        showNotification(error.error || "Gagal menghapus vendor", "error")
      }
    }
  }

  window.editVendorType = (id, nama) => {
    document.getElementById("vendorTypeModalTitle").textContent = "Edit Jenis Vendor"
    document.getElementById("submitVendorTypeBtn").textContent = "Simpan Perubahan"
    document.querySelector('#addVendorTypeForm input[name="nama"]').value = nama
    document.getElementById("addVendorTypeForm").dataset.editId = id
    document.getElementById("addVendorTypeModal").classList.remove("hidden")
  }

  window.deleteVendorType = async (id) => {
    if (!confirm("Yakin ingin menghapus jenis vendor ini?")) return

    try {
      await apiCall(`/vendor-types/${id}`, { method: "DELETE" })
      showNotification("Jenis vendor berhasil dihapus")
      loadVendorTypesList()
      loadVendorTypes()
    } catch (error) {
      console.error("Error deleting vendor type:", error)
      if (error.constraint === "foreign_key") {
        showFKConstraintWarning("Tidak Dapat Menghapus Jenis Vendor", error.error, error.details)
      } else {
        showNotification(error.error || "Gagal menghapus jenis vendor", "error")
      }
    }
  }

  function showFKConstraintWarning(title, message, details) {
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
        </div>
        <div class="mb-4">
          <p class="text-gray-700 mb-3">${message}</p>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p class="text-sm text-yellow-800"><strong>Detail:</strong> ${details}</p>
          </div>
        </div>
        <div class="flex justify-end">
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded">
            Mengerti
          </button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
    setTimeout(() => modal.parentNode && modal.remove(), 10000)
  }
})

// CSS for tabs
const style = document.createElement("style")
style.textContent = `
  .tab-btn {
    padding: 0.5rem 1rem;
    border-bottom: 2px solid transparent;
    font-weight: 500;
    color: #6B7280;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .tab-btn:hover {
    color: #3B82F6;
  }
  .tab-btn.active {
    color: #3B82F6;
    border-bottom-color: #3B82F6;
  }
`
document.head.appendChild(style)
