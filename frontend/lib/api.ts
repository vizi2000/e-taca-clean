import { apiEndpoints } from './api-config'

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  totalRaised: number
  goalTarget: number
}

export interface Goal {
  id: string
  organizationId: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  imageUrl?: string
  slug: string
  isActive: boolean
}

export interface DonationData {
  goalId: string
  amount: number
  donorName?: string
  donorEmail?: string
  message?: string
}

class ApiService {
  private async fetcher<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return response.json()
  }

  async getOrganization(slug: string): Promise<Organization> {
    return this.fetcher<Organization>(apiEndpoints.organizations.getBySlug(slug))
  }

  async getOrganizationGoals(orgId: string): Promise<Goal[]> {
    return this.fetcher<Goal[]>(`/organizations/${orgId}/goals`)
  }

  async getGoal(orgId: string, goalId: string): Promise<Goal> {
    return this.fetcher<Goal>(`/organizations/${orgId}/goals/${goalId}`)
  }

  async createDonation(data: DonationData): Promise<{ paymentUrl: string }> {
    return this.fetcher<{ paymentUrl:string }>(
      apiEndpoints.donations.initiate,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }
}

export const api = new ApiService()