using ETaca.Domain.Enums;

namespace ETaca.API.Services;

public interface IAdminStatisticsService
{
    /// <summary>
    /// Gets comprehensive admin statistics with caching support
    /// </summary>
    /// <param name="forceRefresh">Force refresh of cached data</param>
    /// <returns>Admin statistics data</returns>
    Task<AdminStatisticsDto> GetStatisticsAsync(bool forceRefresh = false);
    Task<AdminStatisticsDto> GetBasicStatisticsAsync(); // Fast basic stats
    
    /// <summary>
    /// Gets organization statistics with pagination
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <returns>Paginated organization data</returns>
    Task<PaginatedOrganizationsDto> GetOrganizationsAsync(int page = 1, int pageSize = 20);
    
    /// <summary>
    /// Gets user statistics with pagination
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <returns>Paginated user data</returns>
    Task<PaginatedUsersDto> GetUsersAsync(int page = 1, int pageSize = 20);
    
    /// <summary>
    /// Gets goal statistics with pagination
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <returns>Paginated goal data</returns>
    Task<PaginatedGoalsDto> GetGoalsAsync(int page = 1, int pageSize = 20);
    
    /// <summary>
    /// Clears all cached admin data
    /// </summary>
    void ClearCache();
}

public record AdminStatisticsDto
{
    public OrganizationStatsDto Organizations { get; init; } = new();
    public DonationStatsDto Donations { get; init; } = new();
    public UserStatsDto Users { get; init; } = new();
    public GoalStatsDto Goals { get; init; } = new();
    public DateTime GeneratedAt { get; init; } = DateTime.UtcNow;
}

public record OrganizationStatsDto
{
    public int Total { get; init; }
    public int Active { get; init; }
    public int Pending { get; init; }
    public int Inactive { get; init; }
}

public record DonationStatsDto
{
    public int Total { get; init; }
    public int Paid { get; init; }
    public decimal TotalAmount { get; init; }
    public int Last30Days { get; init; }
}

public record UserStatsDto
{
    public int Total { get; init; }
    public int Active { get; init; }
    public int Admins { get; init; }
    public int OrgOwners { get; init; }
}

public record GoalStatsDto
{
    public int Total { get; init; }
    public int Active { get; init; }
}

public record PaginatedOrganizationsDto
{
    public List<OrganizationDto> Organizations { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
}

public record OrganizationDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Nip { get; init; } = string.Empty;
    public string? Krs { get; init; }
    public string Email { get; init; } = string.Empty;
    public OrganizationStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public bool HasFiservConfig { get; init; }
    public int GoalsCount { get; init; }
    public int TotalDonations { get; init; }
    public decimal TotalAmount { get; init; }
}

public record PaginatedUsersDto
{
    public List<UserDto> Users { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
}

public record UserDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public UserRole Role { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public OrganizationInfoDto? Organization { get; init; }
}

public record OrganizationInfoDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
}

public record PaginatedGoalsDto
{
    public List<GoalDto> Goals { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
}

public record GoalDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal? TargetAmount { get; init; }
    public decimal CurrentAmount { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public string Slug { get; init; } = string.Empty;
    public OrganizationInfoDto? Organization { get; init; }
    public int DonationsCount { get; init; }
    public decimal Progress { get; init; }
    public string GoalUrl { get; init; } = string.Empty;
    public string QrCodeUrl { get; init; } = string.Empty;
}
