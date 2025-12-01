    async function loadVendors() {
        try {
        const vendors = await apiCall("/vendors")
        displayVendors(vendors)
        } catch (error) {
        console.error("Error loading vendors:", error)
        showNotification("Gagal memuat data vendor", "error")
        }
    }

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
                                    <button onclick="deleteClient(${client.IdKlien})" 
                                            class="text-red-600 hover:text-red-900">
                                        Hapus
                                    </button>
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

  async function handleAddClient(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    const clientData = {
      nama: formData.get("nama"),
      alamat: formData.get("alamat"),
      noTelp: formData.get("noTelp"),
      email: formData.get("email"),
    }

    try {
      await apiCall("/clients", {
        method: "POST",
        body: JSON.stringify(clientData),
      })

      showNotification("Klien berhasil ditambahkan")
      document.getElementById("addClientModal").classList.add("hidden")
      e.target.reset()

      // Reload clients if currently viewing clients tab
      if (!document.getElementById("clients-tab").classList.contains("hidden")) {
        loadClients()
      }

      // Reload dropdown data
      loadDropdownData()
    } catch (error) {
      showNotification("Gagal menambah klien", "error")
    }
  }

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
      await apiCall(`/clients/${clientId}`, {
        method: "DELETE",
      })

      showNotification("Klien berhasil dihapus")
      loadClients()
      loadOverviewData()
    } catch (error) {
      console.error("Error deleting client:", error)

      // Parse error response for FK constraint details
      let errorMessage = "Gagal menghapus klien"
      let errorDetails = ""

      try {
        const errorResponse = (await error.response?.json?.()) || error
        if (errorResponse.constraint === "foreign_key") {
          errorMessage = errorResponse.error
          errorDetails = errorResponse.details
        }
      } catch (parseError) {
        // Use default error message
      }

      // Show detailed warning modal for FK constraints
      if (errorDetails) {
        showFKConstraintWarning("Tidak Dapat Menghapus Klien", errorMessage, errorDetails)
      } else {
        showNotification(errorMessage, "error")
      }

      if (button) {
        button.innerHTML = originalText
        button.disabled = false
      }
    }
  }

  // Calendar functions for assistant dashboard
  async function loadEventsForCalendar() {
    try {
      eventsData = await apiCall("/events")
    } catch (error) {
      console.error("Error loading events for calendar:", error)
    }
  }

  //load my events
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
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 text-xs rounded-full ${
                                      event.StatusEvent === "Selesai"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }">
                                        ${event.StatusEvent}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(event.BudgetEvent)}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div class="flex space-x-2">
                                        <button onclick="openEventVendorModal(${event.IdEvent}, '${event.Nama}', ${event.BudgetEvent})" 
                                                class="text-primary hover:text-secondary font-medium text-xs">
                                            Kelola Vendor
                                        </button>
                                        ${
                                          event.StatusEvent !== "Selesai"
                                            ? `
                                            <button onclick="completeEvent(${event.IdEvent})" 
                                                    class="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs">
                                                ✓ Selesaikan
                                            </button>
                                            <button onclick="deleteEvent(${event.IdEvent})" 
                                                    class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs">
                                                Hapus
                                            </button>
                                        `
                                            : '<span class="text-green-600 text-xs">✓ Selesai</span>'
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

  async function handleAddEvent(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    const eventData = {
      nama: formData.get("nama"),
      tglEvent: formData.get("tglEvent"),
      jumlahUndangan: Number.parseInt(formData.get("jumlahUndangan")),
      budgetEvent: Number.parseFloat(formData.get("budgetEvent")),
      idJenisEvent: Number.parseInt(formData.get("idJenisEvent")),
      idKlien: Number.parseInt(formData.get("idKlien")),
    }

    try {
      await apiCall("/events", {
        method: "POST",
        body: JSON.stringify(eventData),
      })

      showNotification("Event berhasil ditambahkan")
      document.getElementById("addEventModal").classList.add("hidden")
      e.target.reset()

      // Reload events if currently viewing events tab
      if (!document.getElementById("events-tab").classList.contains("hidden")) {
        loadMyEvents()
      }

      // Reload overview data
      loadOverviewData()
    } catch (error) {
      showNotification("Gagal menambah event", "error")
    }
  }

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
      await apiCall(`/events/${eventId}`, {
        method: "DELETE",
      })

      showNotification("Event berhasil dihapus")
      loadMyEvents()
      loadOverviewData()
      await loadEventsForCalendar()
      renderCalendar()
    } catch (error) {
      console.error("Error deleting event:", error)

      // Parse error response for FK constraint details
      let errorMessage = "Gagal menghapus event"
      let errorDetails = ""

      try {
        const errorResponse = (await error.response?.json?.()) || error
        if (errorResponse.constraint === "foreign_key") {
          errorMessage = errorResponse.error
          errorDetails = errorResponse.details
        }
      } catch (parseError) {
        // Use default error message
      }

      // Show detailed warning modal for FK constraints
      if (errorDetails) {
        showFKConstraintWarning("Tidak Dapat Menghapus Event", errorMessage, errorDetails)
      } else {
        showNotification(errorMessage, "error")
      }

      if (button) {
        button.innerHTML = originalText
        button.disabled = false
      }
    }
  }

  window.completeEvent = async (eventId) => {
    const button = document.querySelector(`button[onclick="completeEvent(${eventId})"]`)
    const originalText = button.innerHTML

    // Show loading state
    button.innerHTML =
      '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Memproses...'
    button.disabled = true
    button.classList.add("opacity-75", "cursor-not-allowed")

    try {
      await apiCall(`/events/${eventId}/complete`, {
        method: "PUT",
      })

      button.innerHTML = "✓ Berhasil!"
      button.classList.remove("bg-green-500", "hover:bg-green-600")
      button.classList.add("bg-green-600")

      showNotification("Event berhasil diselesaikan")

      setTimeout(async () => {
        document.getElementById("eventDetailModal").classList.add("hidden")

        // Reload events data
        await loadEventsForCalendar()
        renderCalendar()

        // Reload overview if on overview tab
        if (!document.getElementById("overview-tab").classList.contains("hidden")) {
          await loadOverviewData()
        }

        // Reload events tab if currently viewing
        if (!document.getElementById("events-tab").classList.contains("hidden")) {
          await loadMyEvents()
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

  //render calendar
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

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      calendarHTML += '<div class="p-2"></div>'
    }

    // Days of the month
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

  //loadEventsForCalendar
  async function loadEventsForCalendar() {
    try {
      eventsData = await apiCall("/events")
    } catch (error) {
      console.error("Error loading events for calendar:", error)
    }
  }