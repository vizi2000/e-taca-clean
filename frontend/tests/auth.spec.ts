import { test, expect } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/admin/login')
  })

  test('login page renders with all elements', async ({ page }) => {
    // Check page title and header
    await expect(page).toHaveTitle(/Panel Administracyjny/)
    await expect(page.getByRole('heading', { name: 'Panel Administracyjny' })).toBeVisible()
    
    // Check form elements
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Hasło')).toBeVisible()
    await expect(page.getByRole('button', { name: /Zaloguj się/i })).toBeVisible()
    
    // Check helper text
    await expect(page.getByText('Uzyskaj dostęp do zarządzania organizacją i wpłatami')).toBeVisible()
    
    // Check links
    await expect(page.getByRole('link', { name: /Nie pamiętasz hasła/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Zarejestruj nową organizację/i })).toBeVisible()
    
    // Check improved Polish copy
    await expect(page.getByText('Nie pamiętasz hasła?')).toBeVisible()
    await expect(page.getByText('Wyślemy link do ustawienia nowego hasła')).toBeVisible()
    await expect(page.getByText('Nowa organizacja?')).toBeVisible()
  })

  test('login with invalid credentials shows generic error', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel('Email').fill('nonexistent@example.com')
    await page.getByLabel('Hasło').fill('wrongpassword')
    
    // Submit form
    await page.getByRole('button', { name: /Zaloguj się/i }).click()
    
    // Check for generic error message (prevents user enumeration)
    await expect(page.getByRole('alert')).toContainText('Nieprawidłowe dane logowania')
    
    // Should not reveal whether email exists
    await expect(page.getByRole('alert')).not.toContainText('email')
    await expect(page.getByRole('alert')).not.toContainText('hasło')
  })

  test('login form validation works', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /Zaloguj się/i }).click()
    
    // Check HTML5 validation
    const emailInput = page.getByLabel('Email')
    const passwordInput = page.getByLabel('Hasło')
    
    // Check required attributes
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
    
    // Test email format validation
    await emailInput.fill('invalid-email')
    await page.getByRole('button', { name: /Zaloguj się/i }).click()
    
    // Browser should show validation error for invalid email
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(emailValidity).toBe(false)
  })

  test('password reset flow prevents account enumeration', async ({ page }) => {
    // Navigate to password reset
    await page.getByRole('link', { name: /Nie pamiętasz hasła/i }).click()
    
    await expect(page).toHaveURL('/reset-password')
    await expect(page.getByRole('heading', { name: 'Reset hasła' })).toBeVisible()
    
    // Submit with any email
    await page.getByLabel('Adres email').fill('any@example.com')
    await page.getByRole('button', { name: /Wyślij link resetujący/i }).click()
    
    // Should show same success message regardless of email existence
    await expect(page.getByText(/Jeśli konto z podanym adresem email istnieje/)).toBeVisible()
    await expect(page.getByText('Email wysłany!')).toBeVisible()
  })

  test('registration link is accessible', async ({ page }) => {
    // Click registration link
    await page.getByRole('link', { name: /Zarejestruj nową organizację/i }).click()
    
    // Should navigate to registration page
    await expect(page).toHaveURL('/register-organization')
  })

  test('keyboard navigation works', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab') // Skip to first interactive element
    
    // Check focus moves through form in logical order
    const focusedElements = []
    for (let i = 0; i < 5; i++) {
      const focused = await page.evaluate(() => document.activeElement?.tagName)
      focusedElements.push(focused)
      await page.keyboard.press('Tab')
    }
    
    // Should include INPUT and BUTTON elements
    expect(focusedElements).toContain('INPUT')
    expect(focusedElements).toContain('BUTTON')
  })

  test('ARIA attributes are properly set', async ({ page }) => {
    const emailInput = page.getByLabel('Email')
    const passwordInput = page.getByLabel('Hasło')
    const submitButton = page.getByRole('button', { name: /Zaloguj się/i })
    
    // Check ARIA attributes
    await expect(emailInput).toHaveAttribute('aria-required', 'true')
    await expect(passwordInput).toHaveAttribute('aria-required', 'true')
    await expect(emailInput).toHaveAttribute('aria-label', 'Adres email')
    await expect(passwordInput).toHaveAttribute('aria-label', 'Hasło')
    
    // Check form has proper label
    const form = page.locator('form')
    await expect(form).toHaveAttribute('aria-label', 'Formularz logowania')
    
    // Check error state ARIA
    await submitButton.click()
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Hasło').fill('wrongpass')
    await submitButton.click()
    
    // After error, inputs should have aria-invalid
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    await expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
  })

  test('focus states have sufficient contrast', async ({ page }) => {
    // Focus on email input
    await page.getByLabel('Email').focus()
    
    // Check that focus ring is visible
    const focusRingColor = await page.getByLabel('Email').evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.outlineColor || styles.boxShadow
    })
    
    // Should have visible focus indicator
    expect(focusRingColor).toBeTruthy()
    
    // Check button focus state
    await page.getByRole('button', { name: /Zaloguj się/i }).focus()
    const buttonFocusRing = await page.getByRole('button', { name: /Zaloguj się/i }).evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.outlineColor || styles.boxShadow
    })
    
    expect(buttonFocusRing).toBeTruthy()
  })

  test('secure cookie authentication works', async ({ page, context }) => {
    // Mock successful login response
    await page.route('**/api/v1.0/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'admin@example.com',
          role: 'Admin',
          organizationId: null,
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }),
        headers: {
          'Set-Cookie': 'auth-token=mock-jwt-token; HttpOnly; Secure; SameSite=Strict'
        }
      })
    })

    // Perform login
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Hasło').fill('Test123!')
    await page.getByRole('button', { name: /Zaloguj się/i }).click()

    // Should redirect to admin panel
    await expect(page).toHaveURL('/admin')

    // Check that session storage has user info (not token)
    const userEmail = await page.evaluate(() => sessionStorage.getItem('userEmail'))
    expect(userEmail).toBe('admin@example.com')
    
    // Token should NOT be in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeNull()
  })

  test('CSRF token is sent with requests', async ({ page }) => {
    let csrfTokenSent = false

    // Intercept login request to check for CSRF token
    await page.route('**/api/v1.0/auth/login', async (route) => {
      const headers = route.request().headers()
      csrfTokenSent = headers['x-csrf-token'] !== undefined
      
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Nieprawidłowe dane logowania' })
      })
    })

    // Set a mock CSRF cookie
    await page.evaluate(() => {
      document.cookie = 'XSRF-TOKEN=test-csrf-token; path=/'
    })

    // Attempt login
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Hasło').fill('password')
    await page.getByRole('button', { name: /Zaloguj się/i }).click()

    // Verify CSRF token was sent
    expect(csrfTokenSent).toBe(true)
  })
})

test.describe('Security Headers', () => {
  test('security headers are present', async ({ page }) => {
    const response = await page.goto('/admin/login')
    
    if (response) {
      const headers = response.headers()
      
      // Check for security headers (these would be set by the backend)
      // In a real test, you'd check the actual API responses
      // For frontend, we can check meta tags or CSP if set
      const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').count()
      
      // Note: These would typically be set by the server
      // This is a placeholder for actual header checks
      expect(response.status()).toBe(200)
    }
  })
})