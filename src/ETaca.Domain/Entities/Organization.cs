using ETaca.Domain.Shared;
using ETaca.Domain.Enums;

namespace ETaca.Domain.Entities;

public class Organization : Entity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Nip { get; set; } = string.Empty;
    public string? Krs { get; set; }
    public string BankAccount { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public OrganizationStatus Status { get; set; } = OrganizationStatus.Pending;
    public string Slug { get; set; } = string.Empty;
    public string? ThemePrimary { get; set; }
    public float? ThemeOverlay { get; set; }
    public string? HeroImageUrl { get; set; }
    public string? FiservStoreId { get; set; }
    public string? FiservSecret { get; set; }
    
    public ICollection<DonationGoal> Goals { get; set; } = new List<DonationGoal>();
    public ICollection<Donation> Donations { get; set; } = new List<Donation>();
}