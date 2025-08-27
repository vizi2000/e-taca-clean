// API Configuration
// This file centralizes all API endpoint configuration to avoid hardcoded URLs

export const getApiUrl = () => {
  // Use the environment variable for the API URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1.0'
}

export const API_BASE_URL = getApiUrl()

// Helper function to build API endpoints
export const apiEndpoint = (path: string) => {
  const base = getApiUrl()
  return `${base}${path.startsWith('/') ? path : '/' + path}`
}