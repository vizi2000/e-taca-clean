using ETaca.Domain.Shared;
using ETaca.Domain.Enums;

namespace ETaca.Domain.Entities;

public class User : Entity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.OrgOwner;
    public Guid? OrganizationId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    
    public Organization? Organization { get; set; }
}