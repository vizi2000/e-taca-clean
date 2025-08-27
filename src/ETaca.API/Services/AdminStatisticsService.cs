using ETaca.Domain.Entities;
using ETaca.Domain.Enums;
using ETaca.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ETaca.API.Services;

public class AdminStatisticsService : IAdminStatisticsService
{
    private readonly ETacaDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AdminStatisticsService> _logger;
    private readonly IConfiguration _configuration;
    
    private const string StatisticsCacheKey = "admin_statistics";
    private const string OrganizationsCacheKey = "admin_organizations";
    private const string UsersCacheKey = "admin_users";
    private const string GoalsCacheKey = "admin_goals";
    private static readonly TimeSpan CacheExpiration = TimeSpan.FromMinutes(5);

    public AdminStatisticsService(
        ETacaDbContext context,
        IMemoryCache cache,
        ILogger<AdminStatisticsService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<AdminStatisticsDto> GetStatisticsAsync(bool forceRefresh = false)
    {
        if (!forceRefresh && _cache.TryGetValue(StatisticsCacheKey, out AdminStatisticsDto? cachedStats))
        {
            _logger.LogDebug("Returning cached admin statistics");
            return cachedStats!;
        }

        try
        {
            _logger.LogInformation("Generating fresh admin statistics with simple queries");
            
            // SIMPLE COUNT QUERIES - No GroupBy, No complex operations
            var orgTotal = await _context.Organizations.CountAsync();
            var orgActive = await _context.Organizations.CountAsync(o => o.Status == OrganizationStatus.Active);
            var orgPending = await _context.Organizations.CountAsync(o => o.Status == OrganizationStatus.Pending);
            var orgInactive = await _context.Organizations.CountAsync(o => o.Status == OrganizationStatus.Inactive);
            
            var donationsTotal = await _context.Donations.CountAsync();
            var donationsPaid = await _context.Donations.CountAsync(d => d.Status == DonationStatus.Paid);
            
            var usersTotal = await _context.Users.CountAsync();
            var usersActive = await _context.Users.CountAsync(u => u.IsActive);
            var usersAdmins = await _context.Users.CountAsync(u => u.Role == UserRole.Admin);
            var usersOrgOwners = await _context.Users.CountAsync(u => u.Role == UserRole.OrgOwner);
            
            var goalsTotal = await _context.DonationGoals.CountAsync();
            var goalsActive = await _context.DonationGoals.CountAsync(g => g.IsActive);
            
            // Only calculate total amount if we have donations (optional optimization)
            decimal totalAmount = 0;
            int last30Days = 0;
            
            if (donationsPaid > 0)
            {
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                totalAmount = await _context.Donations
                    .Where(d => d.Status == DonationStatus.Paid)
                    .SumAsync(d => (decimal?)d.Amount) ?? 0;
                    
                last30Days = await _context.Donations
                    .CountAsync(d => d.Status == DonationStatus.Paid && d.CreatedAt >= thirtyDaysAgo);
            }
            
            var statistics = new AdminStatisticsDto
            {
                Organizations = new OrganizationStatsDto
                {
                    Total = orgTotal,
                    Active = orgActive,
                    Pending = orgPending,
                    Inactive = orgInactive
                },
                Donations = new DonationStatsDto
                {
                    Total = donationsTotal,
                    Paid = donationsPaid,
                    TotalAmount = totalAmount,
                    Last30Days = last30Days
                },
                Users = new UserStatsDto
                {
                    Total = usersTotal,
                    Active = usersActive,
                    Admins = usersAdmins,
                    OrgOwners = usersOrgOwners
                },
                Goals = new GoalStatsDto
                {
                    Total = goalsTotal,
                    Active = goalsActive
                }
            };

            // Cache the results
            _cache.Set(StatisticsCacheKey, statistics, CacheExpiration);
            
            _logger.LogInformation("Admin statistics generated and cached successfully");
            return statistics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating admin statistics");
            throw;
        }
    }

    public async Task<AdminStatisticsDto> GetBasicStatisticsAsync()
    {
        try
        {
            _logger.LogInformation("Generating basic admin statistics");
            
            // Use simple COUNT queries without complex aggregations
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10)); // 10 second timeout for basic stats
            
            var orgTotalTask = _context.Organizations.CountAsync(cts.Token);
            var orgActiveTask = _context.Organizations.CountAsync(o => o.Status == OrganizationStatus.Active, cts.Token);
            var orgPendingTask = _context.Organizations.CountAsync(o => o.Status == OrganizationStatus.Pending, cts.Token);
            var orgInactiveTask = _context.Organizations.CountAsync(o => o.Status == OrganizationStatus.Inactive, cts.Token);
            
            var donationsTotalTask = _context.Donations.CountAsync(cts.Token);
            var donationsPaidTask = _context.Donations.CountAsync(d => d.Status == DonationStatus.Paid, cts.Token);
            
            var usersTotalTask = _context.Users.CountAsync(cts.Token);
            var usersActiveTask = _context.Users.CountAsync(u => u.IsActive, cts.Token);
            var usersAdminsTask = _context.Users.CountAsync(u => u.Role == UserRole.Admin && u.IsActive, cts.Token);
            var usersOrgOwnersTask = _context.Users.CountAsync(u => u.Role == UserRole.OrgOwner && u.IsActive, cts.Token);
            
            var goalsTotalTask = _context.DonationGoals.CountAsync(cts.Token);
            var goalsActiveTask = _context.DonationGoals.CountAsync(g => g.IsActive, cts.Token);
            
            // Execute all count queries concurrently
            await Task.WhenAll(
                orgTotalTask, orgActiveTask, orgPendingTask, orgInactiveTask,
                donationsTotalTask, donationsPaidTask,
                usersTotalTask, usersActiveTask, usersAdminsTask, usersOrgOwnersTask,
                goalsTotalTask, goalsActiveTask
            );
            
            var statistics = new AdminStatisticsDto
            {
                Organizations = new OrganizationStatsDto
                {
                    Total = orgTotalTask.Result,
                    Active = orgActiveTask.Result,
                    Pending = orgPendingTask.Result,
                    Inactive = orgInactiveTask.Result
                },
                Donations = new DonationStatsDto
                {
                    Total = donationsTotalTask.Result,
                    Paid = donationsPaidTask.Result,
                    TotalAmount = 0, // Skip complex sum calculation for basic stats
                    Last30Days = 0   // Skip date filtering for basic stats
                },
                Users = new UserStatsDto
                {
                    Total = usersTotalTask.Result,
                    Active = usersActiveTask.Result,
                    Admins = usersAdminsTask.Result,
                    OrgOwners = usersOrgOwnersTask.Result
                },
                Goals = new GoalStatsDto
                {
                    Total = goalsTotalTask.Result,
                    Active = goalsActiveTask.Result
                }
            };
            
            _logger.LogInformation("Basic admin statistics generated successfully");
            return statistics;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Basic admin statistics generation timed out");
            throw new TimeoutException("Basic admin statistics generation timed out");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating basic admin statistics");
            throw;
        }
    }

    public async Task<PaginatedOrganizationsDto> GetOrganizationsAsync(int page = 1, int pageSize = 20)
    {
        var cacheKey = $"{OrganizationsCacheKey}_{page}_{pageSize}";
        
        if (_cache.TryGetValue(cacheKey, out PaginatedOrganizationsDto? cachedResult))
        {
            _logger.LogDebug("Returning cached organizations for page {Page}", page);
            return cachedResult!;
        }

        try
        {
            // Use separate queries instead of Include() to avoid loading entire entities
            var organizations = await _context.Organizations
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.Nip,
                    o.Krs,
                    o.Email,
                    o.Status,
                    o.CreatedAt,
                    HasFiservConfig = !string.IsNullOrEmpty(o.FiservStoreId)
                })
                .AsSplitQuery()
                .ToListAsync();

            // Get counts separately to avoid N+1 queries
            var orgIds = organizations.Select(o => o.Id).ToList();
            
            var goalsCounts = await _context.DonationGoals
                .Where(g => orgIds.Contains(g.OrganizationId) && g.IsActive)
                .GroupBy(g => g.OrganizationId)
                .Select(g => new { OrganizationId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.OrganizationId, x => x.Count);
            
            var donationsStats = await _context.Donations
                .Where(d => orgIds.Contains(d.OrganizationId) && d.Status == DonationStatus.Paid)
                .GroupBy(d => d.OrganizationId)
                .Select(g => new 
                { 
                    OrganizationId = g.Key, 
                    Count = g.Count(),
                    TotalAmount = g.Sum(d => (decimal?)d.Amount) ?? 0
                })
                .ToDictionaryAsync(x => x.OrganizationId, x => new { x.Count, x.TotalAmount });

            // Combine the data
            var enrichedOrganizations = organizations.Select(o => new OrganizationDto
            {
                Id = o.Id,
                Name = o.Name,
                Nip = o.Nip,
                Krs = o.Krs,
                Email = o.Email,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                HasFiservConfig = o.HasFiservConfig,
                GoalsCount = goalsCounts.GetValueOrDefault(o.Id, 0),
                TotalDonations = donationsStats.GetValueOrDefault(o.Id, new { Count = 0, TotalAmount = 0m }).Count,
                TotalAmount = donationsStats.GetValueOrDefault(o.Id, new { Count = 0, TotalAmount = 0m }).TotalAmount
            }).ToList();

            var totalCount = await _context.Organizations.CountAsync();

            var result = new PaginatedOrganizationsDto
            {
                Organizations = enrichedOrganizations,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            // Cache the results
            _cache.Set(cacheKey, result, CacheExpiration);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting organizations for page {Page}", page);
            throw;
        }
    }

    public async Task<PaginatedUsersDto> GetUsersAsync(int page = 1, int pageSize = 20)
    {
        var cacheKey = $"{UsersCacheKey}_{page}_{pageSize}";
        
        if (_cache.TryGetValue(cacheKey, out PaginatedUsersDto? cachedResult))
        {
            _logger.LogDebug("Returning cached users for page {Page}", page);
            return cachedResult!;
        }

        try
        {
            // Use separate queries instead of Include() to avoid loading entire entities
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt,
                    u.LastLoginAt,
                    u.OrganizationId
                })
                .AsSplitQuery()
                .ToListAsync();

            // Get organization names separately
            var orgIds = users.Where(u => u.OrganizationId.HasValue).Select(u => u.OrganizationId.Value).Distinct().ToList();
            var organizations = await _context.Organizations
                .Where(o => orgIds.Contains(o.Id))
                .Select(o => new { o.Id, o.Name })
                .ToDictionaryAsync(o => o.Id, o => o.Name);

            var enrichedUsers = users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                Organization = u.OrganizationId.HasValue && organizations.ContainsKey(u.OrganizationId.Value) 
                    ? new OrganizationInfoDto { Id = u.OrganizationId.Value, Name = organizations[u.OrganizationId.Value] } 
                    : null
            }).ToList();

            var totalCount = await _context.Users.CountAsync();

            var result = new PaginatedUsersDto
            {
                Users = enrichedUsers,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            // Cache the results
            _cache.Set(cacheKey, result, CacheExpiration);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users for page {Page}", page);
            throw;
        }
    }

    public async Task<PaginatedGoalsDto> GetGoalsAsync(int page = 1, int pageSize = 20)
    {
        var cacheKey = $"{GoalsCacheKey}_{page}_{pageSize}";
        
        if (_cache.TryGetValue(cacheKey, out PaginatedGoalsDto? cachedResult))
        {
            _logger.LogDebug("Returning cached goals for page {Page}", page);
            return cachedResult!;
        }

        try
        {
            var baseUrl = _configuration["Frontend:BaseUrl"] ?? "https://e-taca.borg.tools";
            
            // Use separate queries instead of Include() to avoid loading entire entities
            var goals = await _context.DonationGoals
                .OrderByDescending(g => g.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(g => new
                {
                    g.Id,
                    g.Title,
                    g.Description,
                    g.TargetAmount,
                    g.IsActive,
                    g.CreatedAt,
                    g.UpdatedAt,
                    g.Slug,
                    g.OrganizationId
                })
                .AsSplitQuery()
                .ToListAsync();

            // Get organization and donation data separately
            var goalIds = goals.Select(g => g.Id).ToList();
            var orgIds = goals.Select(g => g.OrganizationId).Distinct().ToList();
            
            var organizations = await _context.Organizations
                .Where(o => orgIds.Contains(o.Id))
                .Select(o => new { o.Id, o.Name, o.Slug })
                .ToDictionaryAsync(o => o.Id, o => o);
            
            var donationsStats = await _context.Donations
                .Where(d => goalIds.Contains(d.DonationGoalId ?? Guid.Empty) && d.Status == DonationStatus.Paid)
                .GroupBy(d => d.DonationGoalId ?? Guid.Empty)
                .Select(g => new
                {
                    GoalId = g.Key,
                    Count = g.Count(),
                    TotalAmount = g.Sum(d => (decimal?)d.Amount) ?? 0
                })
                .ToDictionaryAsync(x => x.GoalId, x => new { x.Count, x.TotalAmount });

            var enrichedGoals = goals.Select(g => 
            {
                var org = organizations.GetValueOrDefault(g.OrganizationId);
                var donations = donationsStats.GetValueOrDefault(g.Id, new { Count = 0, TotalAmount = 0m });
                var progress = g.TargetAmount.HasValue && g.TargetAmount > 0 
                    ? (decimal)(donations.TotalAmount / g.TargetAmount.Value * 100) 
                    : 0;
                
                return new GoalDto
                {
                    Id = g.Id,
                    Title = g.Title,
                    Description = g.Description,
                    TargetAmount = g.TargetAmount,
                    CurrentAmount = donations.TotalAmount,
                    IsActive = g.IsActive,
                    CreatedAt = g.CreatedAt,
                    UpdatedAt = g.UpdatedAt,
                    Slug = g.Slug,
                    Organization = org != null ? new OrganizationInfoDto
                    {
                        Id = org.Id,
                        Name = org.Name
                    } : null,
                    DonationsCount = donations.Count,
                    Progress = progress,
                    GoalUrl = org != null ? $"{baseUrl}/{org.Slug}/{g.Slug}" : "",
                    QrCodeUrl = $"{baseUrl}/api/v1.0/qr/goal/{g.Id}"
                };
            }).ToList();

            var totalCount = await _context.DonationGoals.CountAsync();

            var result = new PaginatedGoalsDto
            {
                Goals = enrichedGoals,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            // Cache the results
            _cache.Set(cacheKey, result, CacheExpiration);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting goals for page {Page}", page);
            throw;
        }
    }

    /// <summary>
    /// Clears all cached admin data
    /// </summary>
    public void ClearCache()
    {
        _cache.Remove(StatisticsCacheKey);
        _cache.Remove(OrganizationsCacheKey);
        _cache.Remove(UsersCacheKey);
        _cache.Remove(GoalsCacheKey);
        _logger.LogInformation("Admin statistics cache cleared");
    }
}
