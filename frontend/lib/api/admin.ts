import { API_BASE_URL } from '../api-config'

interface AdminStats {
  organizations: {
    total: number
    active: number
    pending: number
    inactive: number
  }
  donations: {
    total: number
    paid: number
    totalAmount: number
    last30Days: number
  }
  users: {
    total: number
    active: number
    admins: number
    orgOwners: number
  }
  goals: {
    total: number
    active: number
  }
}

export class AdminService {
  private static async request(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('token')
    
    console.log(`AdminService.request - calling: ${API_BASE_URL}${endpoint}`)
    console.log(`AdminService.request - token: ${token ? 'exists' : 'missing'}`)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options?.headers,
        },
      })
      
      clearTimeout(timeoutId)
      console.log(`AdminService.request - response status: ${response.status}`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log(`AdminService.request - response data:`, data)
      return data
    } catch (error) {
      console.error(`AdminService.request - error:`, error)
      throw error
    }
  }

  static async getStatistics(): Promise<AdminStats> {
    return this.request('/admin/statistics')
  }

  static async getOrganizations(page = 1, pageSize = 20) {
    return this.request(`/admin/organizations?page=${page}&pageSize=${pageSize}`)
  }

  static async getUsers(page = 1, pageSize = 20) {
    return this.request(`/admin/users?page=${page}&pageSize=${pageSize}`)
  }

  static async activateOrganization(id: string, fiservStoreId: string, fiservSecret: string) {
    return this.request(`/admin/organizations/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify({ fiservStoreId, fiservSecret }),
    })
  }

  static async deactivateOrganization(id: string, reason: string, suspend = false) {
    return this.request(`/admin/organizations/${id}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason, suspend }),
    })
  }

  static async toggleUserActive(userId: string) {
    return this.request(`/admin/users/${userId}/toggle-active`, {
      method: 'POST',
    })
  }

  static async exportDonationsCSV(params?: {
    startDate?: string
    endDate?: string
    organizationId?: string
    status?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId)
    if (params?.status) queryParams.append('status', params.status)

    const token = localStorage.getItem('token')
    const response = await fetch(
      `${API_BASE_URL}/admin/export/donations?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to export donations')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  static async exportOrganizationsCSV(status?: string) {
    const queryParams = status ? `?status=${status}` : ''
    const token = localStorage.getItem('token')
    
    const response = await fetch(
      `${API_BASE_URL}/admin/export/organizations${queryParams}`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to export organizations')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `organizations_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  static async generateDonationPDF(organizationId: string, goalId?: string) {
    const queryParams = goalId ? `?goalId=${goalId}` : ''
    const token = localStorage.getItem('token')
    
    const response = await fetch(
      `${API_BASE_URL}/admin/pdf/donation/${organizationId}${queryParams}`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to generate PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donation_qr_${organizationId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  static async generateQRCodesPDF(organizationId: string) {
    const token = localStorage.getItem('token')
    
    const response = await fetch(
      `${API_BASE_URL}/admin/pdf/qrcodes/${organizationId}`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to generate QR codes PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qr_codes_${organizationId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  static async sendMonthlyReport(month: string, organizationId?: string) {
    return this.request('/admin/reports/monthly', {
      method: 'POST',
      body: JSON.stringify({ month, organizationId }),
    })
  }
}