using ETaca.Domain.Shared;

namespace ETaca.Domain.Entities;

public class DonationGoal : Entity
{
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? TargetAmount { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    
    public Organization Organization { get; set; } = null!;
    public ICollection<Donation> Donations { get; set; } = new List<Donation>();
}