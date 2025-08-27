using System.ComponentModel.DataAnnotations;

namespace ETaca.API.DTOs;

public record InitiateDonationDto(
    [Required(ErrorMessage = "Organization ID is required")] 
    Guid OrganizationId,
    
    Guid? GoalId,
    
    [Required(ErrorMessage = "Amount is required")]
    [Range(1, 100000, ErrorMessage = "Amount must be between 1 and 100,000 PLN")] 
    decimal Amount,
    
    [Required(ErrorMessage = "Donor email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")] 
    string DonorEmail,
    
    [MaxLength(200, ErrorMessage = "Donor name cannot exceed 200 characters")]
    string? DonorName,
    
    [Required(ErrorMessage = "Consent is required")]
    bool Consent,
    
    [MaxLength(50, ErrorMessage = "UTM source cannot exceed 50 characters")]
    string? UtmSource,
    
    [MaxLength(50, ErrorMessage = "UTM medium cannot exceed 50 characters")]
    string? UtmMedium,
    
    [MaxLength(100, ErrorMessage = "UTM campaign cannot exceed 100 characters")]
    string? UtmCampaign,
    
    string? CaptchaToken
);

public record DonationInitiatedDto(
    string ExternalRef,
    string PaymentFormHtml,
    Guid DonationId
);

public record WebhookPayloadDto
{
    public string? Oid { get; set; }
    public string? Status { get; set; }
    public string? Amount { get; set; }
    public string? Currency { get; set; }
    public string? Hash { get; set; }
    public string? Storename { get; set; }
    public string? Txndatetime { get; set; }
    public Dictionary<string, string> AllFields { get; set; } = new();
}

public record DonationDto(
    Guid Id,
    Guid OrganizationId,
    Guid? GoalId,
    string ExternalRef,
    decimal Amount,
    string DonorEmail,
    string? DonorName,
    string Status,
    DateTime CreatedAt,
    DateTime? PaidAt
);

public record DonationListDto(
    List<DonationDto> Donations,
    int TotalCount,
    decimal TotalAmount,
    int Page,
    int PageSize
);