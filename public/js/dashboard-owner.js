// ------------WP 3.2------------ //
    // -----editVendor------- //
    window.editVendor = async (vendorId) => {
        try {
        const vendors = await apiCall("/vendors")
        const vendor = vendors.find((v) => v.IdVendor === vendorId)

        if (vendor) {
            // Fill form with existing data
            document.querySelector('input[name="nama"]').value = vendor.Nama
            document.querySelector('input[name="namaPemilik"]').value = vendor.NamaPemilik
            document.querySelector('textarea[name="alamat"]').value = vendor.Alamat
            document.querySelector('input[name="noTelp"]').value = vendor.NoTelp
            document.querySelector('input[name="harga"]').value = vendor.Harga
            document.querySelector('select[name="idJenisVendor"]').value = vendor.IdJenisVendor

            // Show modal
            document.getElementById("addVendorModal").classList.remove("hidden")

            // Change form submission to update instead of create
            const form = document.getElementById("addVendorForm")
            form.dataset.editId = vendorId
        }
        } catch (error) {
        console.error("Error loading vendor for edit:", error)
        showNotification("Gagal memuat data vendor", "error")
        }
    }
    // -----deleteVendor------- //
    window.deleteVendor = async (vendorId) => {
        if (!confirm("Yakin ingin menghapus vendor ini?")) return

        const button = document.querySelector(`button[onclick="deleteVendor(${vendorId})"]`)
        let originalText = ""
        if (button) {
        originalText = button.innerHTML
        button.innerHTML =
            '<span class="animate-spin inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full"></span>'
        button.disabled = true
        }

        try {
        await apiCall(`/vendors/${vendorId}`, {
            method: "DELETE",
        })

        showNotification("Vendor berhasil dihapus")
        loadVendors()
        loadOverviewData()
        } catch (error) {
        console.error("Error deleting vendor:", error)

        // Parse error response for FK constraint details
        let errorMessage = "Gagal menghapus vendor"
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
            showFKConstraintWarning("Tidak Dapat Menghapus Vendor", errorMessage, errorDetails)
        } else {
            showNotification(errorMessage, "error")
        }

        if (button) {
            button.innerHTML = originalText
            button.disabled = false
        }
        }
    }

  
    // -----loadVendors------- //
    async function loadVendors() {
        try {
        const vendors = await apiCall("/vendors")
        const vendorsHtml = `
            <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemilik</th>
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vendor.JenisVendorNama}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(vendor.Harga)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vendor.NoTelp}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button onclick="editVendor(${vendor.IdVendor})" 
                                class="text-blue-600 hover:text-blue-900 mr-2">
                        Edit
                        </button>
                        <button onclick="deleteVendor(${vendor.IdVendor})" 
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
        document.getElementById("vendorsTable").innerHTML = vendorsHtml
        } catch (error) {
        console.error("Error loading vendors:", error)
        showNotification("Gagal memuat data vendor", "error")
        }
    }

    // -----handleAddVendor------- //
    async function handleAddVendor(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    const vendorData = {
      nama: formData.get("nama"),
      namaPemilik: formData.get("namaPemilik"),
      alamat: formData.get("alamat"),
      noTelp: formData.get("noTelp"),
      harga: Number.parseFloat(formData.get("harga")),
      idJenisVendor: Number.parseInt(formData.get("idJenisVendor")),
    }

    const editId = e.target.dataset.editId
    if (editId) {
      // Update existing vendor
      try {
        await apiCall(`/vendors/${editId}`, {
          method: "PUT",
          body: JSON.stringify(vendorData),
        })

        showNotification("Vendor berhasil diperbarui")
        document.getElementById("addVendorModal").classList.add("hidden")
        e.target.reset()
        delete e.target.dataset.editId

        // Reload vendors if currently viewing vendors tab
        if (!document.getElementById("vendors-tab").classList.contains("hidden")) {
          loadVendors()
        }

        // Reload overview data
        loadOverviewData()
      } catch (error) {
        console.error("Error updating vendor:", error)
        showNotification("Gagal memperbarui vendor", "error")
      }
    } else {
      // Create new vendor
      try {
        await apiCall("/vendors", {
          method: "POST",
          body: JSON.stringify(vendorData),
        })

        showNotification("Vendor berhasil ditambahkan")
        document.getElementById("addVendorModal").classList.add("hidden")
        e.target.reset()

        // Reload vendors if currently viewing vendors tab
        if (!document.getElementById("vendors-tab").classList.contains("hidden")) {
          loadVendors()
        }

        // Reload overview data
        loadOverviewData()
      } catch (error) {
        console.error("Error adding vendor:", error)
        showNotification("Gagal menambah vendor", "error")
      }
    }
  }
// ------------WP 3.2------------ //


//---3.3
async function loadEvents() {
    try {
      const events = await apiCall("/events")
      const eventsHtml = `
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
                                    ${
                                      event.StatusEvent !== "Selesai"
                                        ? `
                                        <button onclick="completeEvent(${event.IdEvent})" 
                                                class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs">
                                            ✓ Selesaikan
                                        </button>
                                    `
                                        : '<span class="text-green-600">✓ Selesai</span>'
                                    }
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

  //complete event
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

  async function loadEmployees() {
    try {
      const users = await apiCall("/users")
      const assistants = users.filter((user) => user.Role === "asisten")

      const employeesHtml = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${assistants
              .map(
                (assistant) => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${assistant.Nama}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${assistant.Username}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Asisten</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onclick="deleteEmployee(${assistant.IdPengguna})" 
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
      document.getElementById("employeesTable").innerHTML = employeesHtml
    } catch (error) {
      console.error("Error loading employees:", error)
      showNotification("Gagal memuat data asisten", "error")
    }
  }

  async function handleAddEmployee(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    const employeeData = {
      nama: formData.get("nama"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: "asisten",
    }

    try {
      await apiCall("/users", {
        method: "POST",
        body: JSON.stringify(employeeData),
      })

      showNotification("Asisten berhasil ditambahkan")
      document.getElementById("addEmployeeModal").classList.add("hidden")
      e.target.reset()

      // Reload employees if currently viewing employees tab
      if (!document.getElementById("employees-tab").classList.contains("hidden")) {
        loadEmployees()
      }

      // Reload overview data
      loadOverviewData()
    } catch (error) {
      console.error("Error adding employee:", error)
      showNotification("Gagal menambah asisten", "error")
    }
  }

  window.deleteEmployee = async (employeeId) => {
    if (!confirm("Yakin ingin menghapus asisten ini?")) return

    const button = document.querySelector(`button[onclick="deleteEmployee(${employeeId})"]`)
    let originalText = ""
    if (button) {
      originalText = button.innerHTML
      button.innerHTML =
        '<span class="animate-spin inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full"></span>'
      button.disabled = true
    }

    try {
      await apiCall(`/users/${employeeId}`, {
        method: "DELETE",
      })

      showNotification("Asisten berhasil dihapus")
      loadEmployees()
      loadOverviewData()
    } catch (error) {
      console.error("Error deleting employee:", error)

      // Parse error response for FK constraint details
      let errorMessage = "Gagal menghapus asisten"
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
        showFKConstraintWarning("Tidak Dapat Menghapus Asisten", errorMessage, errorDetails)
      } else {
        showNotification(errorMessage, "error")
      }

      if (button) {
        button.innerHTML = originalText
        button.disabled = false
      }
    }
  }
  
