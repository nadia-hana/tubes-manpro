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