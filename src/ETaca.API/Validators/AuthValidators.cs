using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace ETaca.API.Validators;

public static class AuthValidators
{
    public class LoginDtoValidator : IValidatableObject
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
        public string Password { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // Additional custom validation
            if (Email.Contains(" "))
            {
                yield return new ValidationResult("Email cannot contain spaces", new[] { nameof(Email) });
            }
        }
    }

    public class RegisterOrganizationDtoValidator : IValidatableObject
    {
        [Required(ErrorMessage = "Organization name is required")]
        [MinLength(3, ErrorMessage = "Organization name must be at least 3 characters")]
        [MaxLength(100, ErrorMessage = "Organization name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "NIP is required")]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "NIP must be exactly 10 digits")]
        public string Nip { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "KRS cannot exceed 20 characters")]
        [RegularExpression(@"^\d+$", ErrorMessage = "KRS must contain only digits")]
        public string? Krs { get; set; }

        [Required(ErrorMessage = "Bank account is required")]
        [RegularExpression(@"^\d{26}$", ErrorMessage = "Bank account must be 26 digits (Polish IBAN without spaces)")]
        public string BankAccount { get; set; } = string.Empty;

        [Required(ErrorMessage = "Organization email is required")]
        [EmailAddress(ErrorMessage = "Invalid organization email format")]
        [MaxLength(100, ErrorMessage = "Organization email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Admin email is required")]
        [EmailAddress(ErrorMessage = "Invalid admin email format")]
        [MaxLength(100, ErrorMessage = "Admin email cannot exceed 100 characters")]
        public string AdminEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // Password complexity validation
            if (!Regex.IsMatch(Password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"))
            {
                yield return new ValidationResult(
                    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                    new[] { nameof(Password) });
            }

            // Validate NIP checksum (Polish tax number validation)
            if (!IsValidNip(Nip))
            {
                yield return new ValidationResult("Invalid NIP checksum", new[] { nameof(Nip) });
            }

            // Validate IBAN checksum
            if (!IsValidIban(BankAccount))
            {
                yield return new ValidationResult("Invalid bank account checksum", new[] { nameof(BankAccount) });
            }

            // Ensure emails are different
            if (Email.Equals(AdminEmail, StringComparison.OrdinalIgnoreCase))
            {
                yield return new ValidationResult(
                    "Organization email and admin email must be different",
                    new[] { nameof(AdminEmail) });
            }
        }

        private bool IsValidNip(string nip)
        {
            if (string.IsNullOrWhiteSpace(nip) || nip.Length != 10)
                return false;

            int[] weights = { 6, 5, 7, 2, 3, 4, 5, 6, 7 };
            int sum = 0;

            for (int i = 0; i < 9; i++)
            {
                if (!char.IsDigit(nip[i]))
                    return false;
                sum += (nip[i] - '0') * weights[i];
            }

            int checkDigit = sum % 11;
            if (checkDigit == 10)
                checkDigit = 0;

            return checkDigit == (nip[9] - '0');
        }

        private bool IsValidIban(string iban)
        {
            // Basic Polish IBAN validation (26 digits)
            if (string.IsNullOrWhiteSpace(iban) || iban.Length != 26)
                return false;

            // All characters must be digits for Polish IBAN without country code
            return iban.All(char.IsDigit);
        }
    }

    public class PasswordResetDtoValidator : IValidatableObject
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Email.Contains(" "))
            {
                yield return new ValidationResult("Email cannot contain spaces", new[] { nameof(Email) });
            }
        }
    }

    public class PerformPasswordResetDtoValidator : IValidatableObject
    {
        [Required(ErrorMessage = "Reset token is required")]
        [MinLength(32, ErrorMessage = "Invalid reset token")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // Password complexity validation
            if (!Regex.IsMatch(NewPassword, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"))
            {
                yield return new ValidationResult(
                    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                    new[] { nameof(NewPassword) });
            }
        }
    }
}