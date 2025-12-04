document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const errorMessage = document.getElementById("errorMessage")
  const loginButton = document.getElementById("loginButton")

  console.log(" Login page loaded - using direct API approach")

  function showError(message) {
    errorMessage.textContent = message
    errorMessage.classList.remove("hidden")
  }

  function hideError() {
    errorMessage.classList.add("hidden")
  }

  function setLoading(loading) {
    if (loading) {
      loginButton.disabled = true
      loginButton.textContent = "Memproses..."
      loginButton.classList.add("opacity-50", "cursor-not-allowed")
    } else {
      loginButton.disabled = false
      loginButton.textContent = "Masuk"
      loginButton.classList.remove("opacity-50", "cursor-not-allowed")
    }
  }

  async function performLogin(username, password) {
    try {
      console.log(" Making login API call for:", username)

      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      console.log(" Login API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Login gagal")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      console.log(" Token and user data saved to localStorage")

      if (data.user.role === "pemilik_usaha") {
        console.log(" Redirecting to owner dashboard")
        window.location.href = "/dashboard-owner.html"
      } else {
        console.log(" Redirecting to assistant dashboard")
        window.location.href = "/dashboard-assistant.html"
      }

      return data
    } catch (error) {
      console.log(" Login error:", error.message)
      throw error
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    hideError()
    setLoading(true)

    const formData = new FormData(loginForm)
    const username = formData.get("username")
    const password = formData.get("password")

    try {
      await performLogin(username, password)
    } catch (error) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  })


})
