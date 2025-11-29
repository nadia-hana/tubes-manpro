    async function loadVendors() {
        try {
        const vendors = await apiCall("/vendors")
        displayVendors(vendors)
        } catch (error) {
        console.error("Error loading vendors:", error)
        showNotification("Gagal memuat data vendor", "error")
        }
    }