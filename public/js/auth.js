// Authentication utilities
class AuthManager {
  constructor() {
    this.baseURL = "http://localhost:3000/api"
    this.token = localStorage.getItem("token")
    this.user = JSON.parse(localStorage.getItem("user") || "null")
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login gagal")
      }

      this.token = data.token
      this.user = data.user

      localStorage.setItem("token", this.token)
      localStorage.setItem("user", JSON.stringify(this.user))

      return data
    } catch (error) {
      throw error
    }
  }

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  isAuthenticated() {
    return !!this.token
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    }
  }

  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)

      if (response.status === 401) {
        this.logout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "API call failed")
      }

      return data
    } catch (error) {
      throw error
    }
  }

  redirectToDashboard() {
    if (this.user.role === "pemilik_usaha") {
      window.location.href = "/dashboard-owner.html"
    } else {
      window.location.href = "/dashboard-assistant.html"
    }
  }
}

// Global auth instance
const auth = new AuthManager()