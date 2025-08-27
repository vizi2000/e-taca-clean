using System.ComponentModel.DataAnnotations;

namespace ETaca.API.Validators;

public static class DonationValidators
{
    public class InitiateDonationValidator : IValidatableObject
    {
        [Required(ErrorMessage = "Organization ID is required")]
        public Guid OrganizationId { get; set; }

        [Required(ErrorMessage = "Amount is required")]
        [Range(1.00, 1000000.00, ErrorMessage = "Amount must be between 1 and 1,000,000")]
        [RegularExpression(@"^\d+(\.\d{1,2})?$", ErrorMessage = "Amount must have at most 2 decimal places")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Donor name is required")]
        [MinLength(2, ErrorMessage = "Donor name must be at least 2 characters")]
        [MaxLength(100, ErrorMessage = "Donor name cannot exceed 100 characters")]
        public string DonorName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Donor email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string DonorEmail { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number format")]
        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? DonorPhone { get; set; }

        public Guid? DonationGoalId { get; set; }

        [MaxLength(500, ErrorMessage = "Message cannot exceed 500 characters")]
        public string? Message { get; set; }

        [Required(ErrorMessage = "Anonymous flag is required")]
        public bool IsAnonymous { get; set; }

        [Required(ErrorMessage = "Recurring flag is required")]
        public bool IsRecurring { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // Validate amount precision
            var amountString = Amount.ToString("F2");
            if (Amount != decimal.Parse(amountString))
            {
                yield return new ValidationResult(
                    "Amount can have at most 2 decimal places",
                    new[] { nameof(Amount) });
            }

            // Validate email format more strictly
            if (DonorEmail.Contains(" "))
            {
                yield return new ValidationResult(
                    "Email cannot contain spaces",
                    new[] { nameof(DonorEmail) });
            }

            // Validate phone number if provided
            if (!string.IsNullOrWhiteSpace(DonorPhone))
            {
                var digitsOnly = new string(DonorPhone.Where(char.IsDigit).ToArray());
                if (digitsOnly.Length < 9 || digitsOnly.Length > 15)
                {
                    yield return new ValidationResult(
                        "Phone number must contain between 9 and 15 digits",
                        new[] { nameof(DonorPhone) });
                }
            }

            // If anonymous, ensure name is not personally identifiable
            if (IsAnonymous && !string.IsNullOrWhiteSpace(DonorName))
            {
                var anonymousNames = new[] { "anonymous", "anonimowy", "anonim", "nieznany" };
                if (!anonymousNames.Any(n => DonorName.ToLower().Contains(n)))
                {
                    yield return new ValidationResult(
                        "For anonymous donations, please use 'Anonymous' as the donor name",
                        new[] { nameof(DonorName) });
                }
            }
        }
    }

    public class DonationGoalValidator : IValidatableObject
    {
        [Required(ErrorMessage = "Goal name is required")]
        [MinLength(3, ErrorMessage = "Goal name must be at least 3 characters")]
        [MaxLength(100, ErrorMessage = "Goal name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        [MinLength(10, ErrorMessage = "Description must be at least 10 characters")]
        [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Target amount is required")]
        [Range(100.00, 10000000.00, ErrorMessage = "Target amount must be between 100 and 10,000,000")]
        public decimal TargetAmount { get; set; }

        [Required(ErrorMessage = "Start date is required")]
        [DataType(DataType.Date)]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "End date is required")]
        [DataType(DataType.Date)]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "Active status is required")]
        public bool IsActive { get; set; } = true;

        [Url(ErrorMessage = "Invalid image URL format")]
        [MaxLength(500, ErrorMessage = "Image URL cannot exceed 500 characters")]
        public string? ImageUrl { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // Validate date range
            if (EndDate <= StartDate)
            {
                yield return new ValidationResult(
                    "End date must be after start date",
                    new[] { nameof(EndDate) });
            }

            // Validate minimum campaign duration
            if ((EndDate - StartDate).TotalDays < 1)
            {
                yield return new ValidationResult(
                    "Campaign must run for at least 1 day",
                    new[] { nameof(EndDate) });
            }

            // Validate maximum campaign duration
            if ((EndDate - StartDate).TotalDays > 365)
            {
                yield return new ValidationResult(
                    "Campaign cannot run for more than 365 days",
                    new[] { nameof(EndDate) });
            }

            // Validate start date is not too far in the past
            if (StartDate < DateTime.UtcNow.AddDays(-30))
            {
                yield return new ValidationResult(
                    "Start date cannot be more than 30 days in the past",
                    new[] { nameof(StartDate) });
            }

            // Validate end date is in the future for active goals
            if (IsActive && EndDate <= DateTime.UtcNow)
            {
                yield return new ValidationResult(
                    "Active goals must have an end date in the future",
                    new[] { nameof(EndDate) });
            }

            // Validate image URL is HTTPS if provided
            if (!string.IsNullOrWhiteSpace(ImageUrl) && !ImageUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                yield return new ValidationResult(
                    "Image URL must use HTTPS",
                    new[] { nameof(ImageUrl) });
            }
        }
    }
}