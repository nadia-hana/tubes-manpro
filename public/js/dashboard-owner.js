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