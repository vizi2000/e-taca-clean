using ETaca.Domain.Shared;
using ETaca.Domain.Enums;

namespace ETaca.Domain.Entities;

public class Donation : Entity
{
    public Guid OrganizationId { get; set; }
    public Guid? DonationGoalId { get; set; }
    public string ExternalRef { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "PLN";
    public string DonorEmail { get; set; } = string.Empty;
    public string? DonorName { get; set; }
    public DonationStatus Status { get; set; } = DonationStatus.Pending;
    public DateTime? PaidAt { get; set; }
    public string? UtmSource { get; set; }
    public string? UtmMedium { get; set; }
    public string? UtmCampaign { get; set; }
    public bool Consent { get; set; }
    
    public Organization Organization { get; set; } = null!;
    public DonationGoal? DonationGoal { get; set; }
}