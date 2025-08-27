using Asp.Versioning;
using ETaca.API.Services;
using ETaca.Domain.Enums;
using ETaca.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ETaca.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class OrganizationsController : ControllerBase
{
    private readonly ETacaDbContext _context;
    private readonly IQrCodeService _qrCodeService;
    private readonly IPdfGeneratorService _pdfGeneratorService;
    private readonly ILogger<OrganizationsController> _logger;

    public OrganizationsController(ETacaDbContext context, IQrCodeService qrCodeService, IPdfGeneratorService pdfGeneratorService, ILogger<OrganizationsController> logger)
    {
        _context = context;
        _qrCodeService = qrCodeService;
        _pdfGeneratorService = pdfGeneratorService;
        _logger = logger;
    }

    [HttpGet("by-slug/{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetOrganizationBySlug(string slug)
    {
        try
        {
            var organization = await _context.Organizations
                .Where(o => o.Slug == slug && o.Status == OrganizationStatus.Active)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.Email,
                    o.Description,
                    o.ThemePrimary,
                    o.ThemeOverlay,
                    o.HeroImageUrl,
                    Goals = o.Goals.Where(g => g.IsActive).Select(g => new
                    {
                        g.Id,
                        g.Title,
                        g.Description,
                        g.TargetAmount,
                        g.Slug,
                        g.ImageUrl,
                        CollectedAmount = o.Donations
                            .Where(d => d.DonationGoalId == g.Id && d.Status == DonationStatus.Paid)
                            .Sum(d => (decimal?)d.Amount) ?? 0m
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (organization == null)
            {
                _logger.LogWarning("Organization not found for slug: {Slug}", slug);
                return NotFound(new { message = $"Organization with slug '{slug}' not found" });
            }

            return Ok(organization);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting organization by slug: {Slug}", slug);
            return StatusCode(500, new { message = "An error occurred while fetching organization data" });
        }
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyOrganization()
    {
        var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        _logger.LogInformation("GetMyOrganization called for user: {Email}, role: {Role}", userEmail, userRole);
        
        if (string.IsNullOrEmpty(userEmail))
        {
            return BadRequest(new { message = "User email not found in token" });
        }

        // Find user first to get their organizationId
        var user = await _context.Users
            .Where(u => u.Email == userEmail)
            .FirstOrDefaultAsync();

        _logger.LogInformation("User found: {Found}, OrganizationId: {OrgId}", user != null, user?.OrganizationId);

        if (user == null)
        {
            return BadRequest(new { message = "User not found" });
        }

        if (user.OrganizationId == null)
        {
            return BadRequest(new { message = "User is not associated with any organization" });
        }

        // Find organization by user's organizationId
        var organization = await _context.Organizations
            .Where(o => o.Id == user.OrganizationId)
            .FirstOrDefaultAsync();

        _logger.LogInformation("Organization found: {Found}, Name: {Name}", organization != null, organization?.Name);

        if (organization == null)
        {
            return NotFound(new { message = "Organization not found for this user" });
        }

        // Return basic organization data without complex statistics for now
        var result = new
        {
            organization.Id,
            organization.Name,
            organization.Slug,
            organization.Email,
            organization.Nip,
            organization.Krs,
            organization.BankAccount,
            organization.Status,
            organization.ThemePrimary,
            organization.ThemeOverlay,
            organization.HeroImageUrl,
            TotalDonations = 0,
            TotalAmount = 0m,
            Last30DaysDonations = 0,
            MonthlyAverage = 0m
        };

        return Ok(result);
    }

    [HttpGet("{id}/donations")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationDonations(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DonationStatus? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        // Check authorization
        var userOrgId = User.FindFirst("OrganizationId")?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        
        // Check if user has access to this organization
        var hasAccess = userRole == "Admin" || 
                        await _context.Organizations.AnyAsync(o => o.Id == id && o.Email == userEmail);
        
        if (!hasAccess)
        {
            return Forbid();
        }

        var query = _context.Donations
            .Include(d => d.DonationGoal)
            .Where(d => d.OrganizationId == id);

        if (status.HasValue)
            query = query.Where(d => d.Status == status.Value);
        
        if (startDate.HasValue)
            query = query.Where(d => d.CreatedAt >= startDate.Value);
        
        if (endDate.HasValue)
            query = query.Where(d => d.CreatedAt <= endDate.Value);

        var totalCount = await query.CountAsync();
        
        var donations = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                d.Id,
                d.ExternalRef,
                d.Amount,
                d.Currency,
                d.DonorEmail,
                d.DonorName,
                d.Status,
                d.CreatedAt,
                d.PaidAt,
                GoalTitle = d.DonationGoal != null ? d.DonationGoal.Title : "Dowolny cel",
                d.UtmSource,
                d.UtmMedium,
                d.UtmCampaign
            })
            .ToListAsync();

        return Ok(new
        {
            Donations = donations,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("{id}/donations/export")]
    [Authorize]
    public async Task<IActionResult> ExportOrganizationDonations(
        Guid id,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] DonationStatus? status = null)
    {
        // Check authorization
        var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        var hasAccess = userRole == "Admin" || 
                        await _context.Organizations.AnyAsync(o => o.Id == id && o.Email == userEmail);
        
        if (!hasAccess)
        {
            return Forbid();
        }

        var query = _context.Donations
            .Include(d => d.Organization)
            .Include(d => d.DonationGoal)
            .Where(d => d.OrganizationId == id);

        if (status.HasValue)
            query = query.Where(d => d.Status == status.Value);
        
        if (startDate.HasValue)
            query = query.Where(d => d.CreatedAt >= startDate.Value);
        
        if (endDate.HasValue)
            query = query.Where(d => d.CreatedAt <= endDate.Value);

        var donations = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        
        // Use CSV export service
        var csvExportService = HttpContext.RequestServices.GetService<Application.Services.ICsvExportService>();
        if (csvExportService == null)
        {
            return StatusCode(500, new { message = "CSV export service not available" });
        }
        
        var csvData = csvExportService.ExportDonations(donations);
        var fileName = $"donations_{id:N}_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
        
        return File(csvData, "text/csv", fileName);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetOrganization(Guid id)
    {
        try
        {
            // Check authorization
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Check if user has access to this organization
            var hasAccess = userRole == "Admin" || 
                            await _context.Organizations.AnyAsync(o => o.Id == id && o.Email == userEmail);
            
            if (!hasAccess)
            {
                return Forbid();
            }

            var organization = await _context.Organizations
                .Where(o => o.Id == id)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.Slug,
                    o.Email,
                    Stats = new
                    {
                        TotalDonations = o.Donations.Count(d => d.Status == DonationStatus.Paid),
                        TotalAmount = o.Donations.Where(d => d.Status == DonationStatus.Paid).Sum(d => (decimal?)d.Amount) ?? 0m,
                        ActiveGoals = o.Goals.Count(g => g.IsActive),
                        TotalGoals = o.Goals.Count()
                    },
                    Goals = o.Goals.Select(g => new
                    {
                        g.Id,
                        Name = g.Title,  // Map Title to Name for frontend consistency
                        g.Slug,
                        g.TargetAmount,
                        CurrentAmount = o.Donations
                            .Where(d => d.DonationGoalId == g.Id && d.Status == DonationStatus.Paid)
                            .Sum(d => (decimal?)d.Amount) ?? 0m,
                        g.IsActive
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (organization == null)
            {
                _logger.LogWarning("Organization not found for id: {Id}", id);
                return NotFound(new { message = "Organization not found" });
            }

            return Ok(organization);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting organization by id: {Id}", id);
            return StatusCode(500, new { message = "An error occurred while fetching organization data" });
        }
    }

    [HttpGet("{id}/qr-code")]
    public async Task<IActionResult> GetOrganizationQrCode(Guid id)
    {
        var org = await _context.Organizations
            .Where(o => o.Id == id && o.Status == OrganizationStatus.Active)
            .Select(o => o.Slug)
            .FirstOrDefaultAsync();

        if (org == null)
        {
            return NotFound();
        }

        var url = _qrCodeService.GetOrganizationUrl(org);
        var qrCode = _qrCodeService.GenerateQrCode(url);

        return File(qrCode, "image/png", $"qr-{org}.png");
    }

    [HttpGet("{orgId}/goals/{goalId}/qr-code")]
    public async Task<IActionResult> GetGoalQrCode(Guid orgId, Guid goalId)
    {
        var data = await _context.DonationGoals
            .Where(g => g.Id == goalId && g.OrganizationId == orgId && g.IsActive)
            .Select(g => new { OrgSlug = g.Organization.Slug, GoalSlug = g.Slug })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return NotFound();
        }

        var url = _qrCodeService.GetGoalUrl(data.OrgSlug, data.GoalSlug);
        var qrCode = _qrCodeService.GenerateQrCode(url);

        return File(qrCode, "image/png", $"qr-{data.OrgSlug}-{data.GoalSlug}.png");
    }

    [HttpGet("{id}/qr-codes/pdf")]
    [Authorize]
    public async Task<IActionResult> GenerateQRCodesPdf(Guid id)
    {
        try
        {
            // Check authorization
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Check if user has access to this organization
            var hasAccess = userRole == "Admin" || userRole == "OrgOwner" ||
                            await _context.Organizations.AnyAsync(o => o.Id == id && o.Email == userEmail);
            
            if (!hasAccess)
            {
                return Forbid();
            }

            var organization = await _context.Organizations
                .Include(o => o.Goals.Where(g => g.IsActive))
                .FirstOrDefaultAsync(o => o.Id == id);

            if (organization == null)
            {
                return NotFound(new { message = "Organization not found" });
            }

            if (!organization.Goals.Any())
            {
                return BadRequest(new { message = "No active goals found for this organization" });
            }

            // Generate PDF with QR codes for all active goals
            var pdfBytes = await _pdfGeneratorService.GenerateOrganizationQrCodesAsync(organization.Id);
            
            return File(pdfBytes, "application/pdf", $"qr-codes-{organization.Slug}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR codes PDF for organization: {Id}", id);
            return StatusCode(500, new { message = "An error occurred while generating QR codes PDF" });
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateOrganization(Guid id, [FromBody] UpdateOrganizationDto dto)
    {
        // Check authorization
        var userOrgId = User.FindFirst("OrganizationId")?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (userRole != "Admin" && userOrgId != id.ToString())
        {
            return Forbid();
        }

        var organization = await _context.Organizations.FindAsync(id);
        if (organization == null)
        {
            return NotFound();
        }

        if (!string.IsNullOrEmpty(dto.Name))
            organization.Name = dto.Name;
        if (!string.IsNullOrEmpty(dto.Email))
            organization.Email = dto.Email;
        if (!string.IsNullOrEmpty(dto.BankAccount))
            organization.BankAccount = dto.BankAccount;
        if (!string.IsNullOrEmpty(dto.ThemePrimary))
            organization.ThemePrimary = dto.ThemePrimary;
        if (dto.ThemeOverlay.HasValue)
            organization.ThemeOverlay = dto.ThemeOverlay.Value;

        organization.UpdateTimestamp();
        await _context.SaveChangesAsync();

        return Ok(organization);
    }

    [HttpGet("{id}/stats")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationStats(Guid id)
    {
        // Check authorization
        var userOrgId = User.FindFirst("OrganizationId")?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (userRole != "Admin" && userOrgId != id.ToString())
        {
            return Forbid();
        }

        var stats = await _context.Donations
            .Where(d => d.OrganizationId == id)
            .GroupBy(d => d.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count(), Amount = g.Sum(d => d.Amount) })
            .ToListAsync();

        var goalStats = await _context.DonationGoals
            .Where(g => g.OrganizationId == id)
            .Select(g => new
            {
                g.Id,
                g.Title,
                g.TargetAmount,
                CollectedAmount = g.Donations.Where(d => d.Status == DonationStatus.Paid).Sum(d => (decimal?)d.Amount) ?? 0m,
                DonationCount = g.Donations.Count(d => d.Status == DonationStatus.Paid)
            })
            .ToListAsync();

        return Ok(new
        {
            DonationStats = stats,
            GoalStats = goalStats,
            TotalCollected = stats.Where(s => s.Status == "Paid").Sum(s => s.Amount),
            TotalDonations = stats.Where(s => s.Status == "Paid").Sum(s => s.Count)
        });
    }
}

public record UpdateOrganizationDto(
    string? Name,
    string? Email,
    string? BankAccount,
    string? ThemePrimary,
    float? ThemeOverlay
);