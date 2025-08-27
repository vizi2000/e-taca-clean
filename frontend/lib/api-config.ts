export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1.0'

export const apiEndpoints = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register-organization`,
    me: `${API_BASE_URL}/auth/me`,
  },
  organizations: {
    getBySlug: (slug: string) => `${API_BASE_URL}/organizations/by-slug/${slug}`,
    create: `${API_BASE_URL}/organizations`,
    getMine: `${API_BASE_URL}/organizations/my`,
    getDonations: (orgId: string) => `${API_BASE_URL}/organizations/${orgId}/donations`,
  },
  donations: {
    initiate: `${API_BASE_URL}/donations/initiate`,
    webhook: `${API_BASE_URL}/donations/webhook`,
    getStatus: (externalRef: string) => `${API_BASE_URL}/donations/status/${externalRef}`,
  },
  goals: {
    create: (orgId: string) => `${API_BASE_URL}/organizations/${orgId}/goals`,
    update: (orgId: string, goalId: string) => `${API_BASE_URL}/organizations/${orgId}/goals/${goalId}`,
    delete: (orgId: string, goalId: string) => `${API_BASE_URL}/organizations/${orgId}/goals/${goalId}`,
  },
}