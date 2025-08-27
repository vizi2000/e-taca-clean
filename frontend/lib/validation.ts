// Polish NIP (Tax ID) validation
export function validateNIP(nip: string): boolean {
  // Remove any spaces or dashes
  const cleanNIP = nip.replace(/[\s-]/g, '')
  
  // NIP must be exactly 10 digits
  if (!/^\d{10}$/.test(cleanNIP)) {
    return false
  }
  
  // NIP checksum validation
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  let sum = 0
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNIP[i]) * weights[i]
  }
  
  const checksum = sum % 11
  const lastDigit = parseInt(cleanNIP[9])
  
  return checksum === lastDigit
}

// Polish Bank Account (IBAN) validation
export function validateBankAccount(account: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanAccount = account.replace(/\s/g, '').toUpperCase()
  
  // Polish IBAN must be 28 characters: PL + 26 digits
  if (!/^PL\d{26}$/.test(cleanAccount)) {
    // Also accept just 26 digits without PL prefix
    if (!/^\d{26}$/.test(cleanAccount)) {
      return false
    }
  }
  
  // For Polish accounts, we'll accept the format if it matches the pattern
  // Full IBAN validation would require mod-97 check
  return true
}

// Format NIP for display
export function formatNIP(nip: string): string {
  const clean = nip.replace(/[\s-]/g, '')
  if (clean.length !== 10) return nip
  
  // Format as XXX-XXX-XX-XX
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 10)}`
}

// Format bank account for display
export function formatBankAccount(account: string): string {
  const clean = account.replace(/\s/g, '')
  
  // If it starts with PL, format as: PL XX XXXX XXXX XXXX XXXX XXXX XXXX
  if (clean.startsWith('PL')) {
    const digits = clean.slice(2)
    const chunks = []
    for (let i = 0; i < digits.length; i += 4) {
      chunks.push(digits.slice(i, i + 4))
    }
    return `PL ${chunks.join(' ')}`
  }
  
  // Otherwise format as: XX XXXX XXXX XXXX XXXX XXXX XXXX
  const chunks = []
  for (let i = 0; i < clean.length; i += 4) {
    chunks.push(clean.slice(i, i + 4))
  }
  return chunks.join(' ')
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password strength validation
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Hasło musi mieć co najmniej 8 znaków')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną wielką literę')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną małą literę')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną cyfrę')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jeden znak specjalny')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}