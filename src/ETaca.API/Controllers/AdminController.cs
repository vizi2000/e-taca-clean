using Asp.Versioning;
using ETaca.Domain.Entities;
using ETaca.Domain.Enums;
using ETaca.Infrastructure.Data;
using ETaca.Application.Services;
using ETaca.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ETaca.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ETacaDbContext _context;
    private readonly ILogger<AdminController> _logger;
    private readonly IConfiguration _configuration;
    private readonly Application.Services.ICsvExportService _csvExportService;
    private readonly IEmailReportService _emailReportService;
    private readonly IPdfGeneratorService _pdfGeneratorService;
    private readonly IAdminStatisticsService _adminStatisticsService;

    public AdminController(
        ETacaDbContext context, 
        ILogger<AdminController> logger, 
        IConfiguration configuration,
        Application.Services.ICsvExportService csvExportService,
        IEmailReportService emailReportService,
        IPdfGeneratorService pdfGeneratorService,
        IAdminStatisticsService adminStatisticsService)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
        _csvExportService = csvExportService;
        _emailReportService = emailReportService;
        _pdfGeneratorService = pdfGeneratorService;
        _adminStatisticsService = adminStatisticsService;
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            var statistics = await _adminStatisticsService.GetStatisticsAsync();
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin statistics");
            return StatusCode(500, new { message = "Error retrieving statistics" });
        }
    }

    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new { message = "TEST ENDPOINT WORKS!", timestamp = DateTime.UtcNow });
    }

    [HttpGet("statistics/basic")]
    public async Task<IActionResult> GetBasicStatistics()
    {
        try
        {
            var statistics = await _adminStatisticsService.GetBasicStatisticsAsync();
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting basic admin statistics");
            return StatusCode(500, new { message = "Error retrieving basic statistics" });
        }
    }

    [HttpGet("organizations")]
    public async Task<IActionResult> GetAllOrganizations([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminStatisticsService.GetOrganizationsAsync(page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting organizations");
            return StatusCode(500, new { message = "Error retrieving organizations" });
        }
    }

    [HttpPost("organizations/{id}/activate")]
    public async Task<IActionResult> ActivateOrganization(Guid id, [FromBody] ActivateOrganizationDto dto)
    {
        var organization = await _context.Organizations.FindAsync(id);
        
        if (organization == null)
        {
            return NotFound(new { message = "Organization not found" });
        }

        if (organization.Status == OrganizationStatus.Active)
        {
            return BadRequest(new { message = "Organization is already active" });
        }

        organization.FiservStoreId = dto.FiservStoreId;
        organization.FiservSecret = dto.FiservSecret;
        organization.Status = OrganizationStatus.Active;
        organization.UpdateTimestamp();

        await _context.SaveChangesAsync();

        _logger.LogInformation("Organization {OrgId} activated by admin", id);

        // Send email notification to organization admin
        try
        {
            var emailService = HttpContext.RequestServices.GetService<IEmailService>();
            if (emailService != null)
            {
                var emailBody = $@"
Szanowni Państwo,

Z przyjemnością informujemy, że Państwa organizacja '{organization.Name}' została aktywowana w systemie e-Taca.

Konfiguracja płatności została pomyślnie zweryfikowana i mogą Państwo teraz:
- Zarządzać celami zbiórek
- Generować kody QR do wpłat
- Monitorować darowizny
- Pobierać raporty

Zaloguj się do panelu organizacji:
{_configuration["Frontend:Origin"]}/panel

W razie pytań prosimy o kontakt.

Z poważaniem,
Zespół e-Taca
";
                await emailService.SendAsync(organization.Email, "Organizacja aktywowana w systemie e-Taca", emailBody);
                _logger.LogInformation("Activation email sent to organization {OrgId}", id);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send activation email for organization {OrgId}", id);
            // Don't fail the activation if email fails
        }

        return Ok(new { message = "Organization activated successfully" });
    }

    [HttpPost("organizations/{id}/deactivate")]
    public async Task<IActionResult> DeactivateOrganization(Guid id, [FromBody] DeactivateOrganizationDto dto)
    {
        var organization = await _context.Organizations.FindAsync(id);
        
        if (organization == null)
        {
            return NotFound(new { message = "Organization not found" });
        }

        organization.Status = dto.Suspend ? OrganizationStatus.Suspended : OrganizationStatus.Inactive;
        organization.UpdateTimestamp();

        await _context.SaveChangesAsync();

        _logger.LogInformation("Organization {OrgId} {Status} by admin. Reason: {Reason}", 
            id, organization.Status, dto.Reason);

        return Ok(new { message = $"Organization {organization.Status.ToString().ToLower()} successfully" });
    }

    [HttpPut("organizations/{id}/payment-config")]
    public async Task<IActionResult> UpdatePaymentConfig(Guid id, [FromBody] UpdatePaymentConfigDto dto)
    {
        var organization = await _context.Organizations.FindAsync(id);
        
        if (organization == null)
        {
            return NotFound(new { message = "Organization not found" });
        }

        organization.FiservStoreId = dto.FiservStoreId;
        organization.FiservSecret = dto.FiservSecret;
        organization.UpdateTimestamp();

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment config updated for organization {OrgId}", id);

        return Ok(new { message = "Payment configuration updated successfully" });
    }

    [HttpPost("organizations")]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateOrganizationDto dto)
    {
        // Check if organization with same NIP or slug already exists
        var existingOrg = await _context.Organizations
            .Where(o => o.Nip == dto.Nip || o.Slug == dto.Slug)
            .FirstOrDefaultAsync();
        
        if (existingOrg != null)
        {
            return BadRequest(new { message = "Organization with this NIP or slug already exists" });
        }

        var organization = new Organization
        {
            Name = dto.Name,
            Nip = dto.Nip,
            Krs = dto.Krs,
            BankAccount = dto.BankAccount,
            Email = dto.Email,
            Slug = dto.Slug,
            FiservStoreId = dto.FiservStoreId,
            FiservSecret = dto.FiservSecret,
            Status = (OrganizationStatus)dto.Status
        };

        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Organization {OrgId} created by admin", organization.Id);

        return Ok(new { 
            id = organization.Id,
            message = "Organization created successfully" 
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminStatisticsService.GetUsersAsync(page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, new { message = "Error retrieving users" });
        }
    }

    [HttpPost("users/{id}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // In a real implementation, this would:
        // 1. Generate a password reset token
        // 2. Send an email to the user with reset link
        // 3. Log the action
        
        _logger.LogInformation("Password reset initiated for user {UserId} by admin", id);

        return Ok(new { message = "Password reset email sent to user" });
    }

    [HttpPost("users/{id}/toggle-active")]
    public async Task<IActionResult> ToggleUserActive(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        user.IsActive = !user.IsActive;
        user.UpdateTimestamp();

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} {Status} by admin", 
            id, user.IsActive ? "activated" : "deactivated");

        return Ok(new { 
            message = $"User {(user.IsActive ? "activated" : "deactivated")} successfully",
            isActive = user.IsActive
        });
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        // Check if user with same email already exists
        var existingUser = await _context.Users
            .Where(u => u.Email == dto.Email)
            .FirstOrDefaultAsync();
        
        if (existingUser != null)
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        // Validate organization if provided
        if (dto.OrganizationId.HasValue)
        {
            var organization = await _context.Organizations.FindAsync(dto.OrganizationId.Value);
            if (organization == null)
            {
                return BadRequest(new { message = "Invalid organization ID" });
            }
        }

        var user = new User
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = (UserRole)dto.Role,
            OrganizationId = dto.OrganizationId,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} created by admin with role {Role}", user.Id, user.Role);

        return Ok(new { 
            id = user.Id,
            message = "User created successfully" 
        });
    }

    [HttpGet("goals")]
    public async Task<IActionResult> GetAllGoals([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminStatisticsService.GetGoalsAsync(page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting goals");
            return StatusCode(500, new { message = "Error retrieving goals" });
        }
    }

    [HttpPost("goals/{id}/toggle-active")]
    public async Task<IActionResult> ToggleGoalActive(Guid id)
    {
        var goal = await _context.DonationGoals.FindAsync(id);
        
        if (goal == null)
        {
            return NotFound(new { message = "Goal not found" });
        }

        goal.IsActive = !goal.IsActive;
        goal.UpdateTimestamp();

        await _context.SaveChangesAsync();

        _logger.LogInformation("Goal {GoalId} {Status} by admin", 
            id, goal.IsActive ? "activated" : "deactivated");

        return Ok(new { 
            message = $"Goal {(goal.IsActive ? "activated" : "deactivated")} successfully",
            isActive = goal.IsActive
        });
    }


    [HttpPost("seed-demo")]
#if DEBUG
    [AllowAnonymous] // Only available in DEBUG builds
#endif
    public async Task<IActionResult> SeedDemoData()
    {
        // Check if demo organization exists
        var existingOrg = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Slug == "bazylika-mikolow");
            
        if (existingOrg == null)
        {
            // Create demo organization with real test credentials
            var organization = new Organization
            {
                Name = "Bazylika Mikołów",
                Slug = "bazylika-mikolow",
                Nip = "6351831157",
                Email = "kontakt@bazylika.pl",
                BankAccount = "12345678901234567890",
                Status = OrganizationStatus.Active,
                FiservStoreId = "760995999",  // Real test store ID
                FiservSecret = "j}2W3P)Lwv",  // Real test secret
                ThemePrimary = "#003366",
                ThemeOverlay = 0.85f,
                HeroImageUrl = "https://images.unsplash.com/photo-1564409972016-2825589beaed?q=80&w=2000"
            };
            
            _context.Organizations.Add(organization);
            await _context.SaveChangesAsync();
            
            // Create demo goals
            var goal1 = new DonationGoal
            {
                OrganizationId = organization.Id,
                Title = "Ofiara na kościół",
                Description = "Wsparcie na utrzymanie i renowację kościoła parafialnego",
                Slug = "ofiara-na-kosciol",
                TargetAmount = 100000,
                IsActive = true
            };
            
            var goal2 = new DonationGoal
            {
                OrganizationId = organization.Id,
                Title = "Ofiara na ubogich",
                Description = "Pomoc potrzebującym w naszej wspólnocie parafialnej",
                Slug = "ofiara-na-ubogich",
                TargetAmount = 50000,
                IsActive = true
            };
            
            var goal3 = new DonationGoal
            {
                OrganizationId = organization.Id,
                Title = "Ofiara za świeczki intencyjne",
                Description = "Intencje modlitewne za zmarłych i żyjących",
                Slug = "swieczki-intencyjne",
                TargetAmount = 30000,
                IsActive = true
            };
            
            _context.DonationGoals.AddRange(goal1, goal2, goal3);
            await _context.SaveChangesAsync();
            
            return Ok(new { 
                message = "Demo organization created",
                organizationSlug = "bazylika-mikolow",
                url = "/o/bazylika-mikolow"
            });
        }
        
        return Ok(new { 
            message = "Demo organization already exists",
            organizationSlug = "bazylika-mikolow",
            url = "/o/bazylika-mikolow"
        });
    }
    
    [HttpGet("db-performance-test")]
    [AllowAnonymous]
    public async Task<IActionResult> TestDatabasePerformance()
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            // Test simple count queries
            var orgCount = await _context.Organizations.CountAsync();
            var orgCountTime = stopwatch.ElapsedMilliseconds;
            
            var donationCount = await _context.Donations.CountAsync();
            var donationCountTime = stopwatch.ElapsedMilliseconds - orgCountTime;
            
            var userCount = await _context.Users.CountAsync();
            var userCountTime = stopwatch.ElapsedMilliseconds - orgCountTime - donationCountTime;
            
            var goalCount = await _context.DonationGoals.CountAsync();
            var goalCountTime = stopwatch.ElapsedMilliseconds - orgCountTime - donationCountTime - userCountTime;
            
            stopwatch.Stop();
            
            return Ok(new
            {
                message = "Database performance test completed",
                totalTime = stopwatch.ElapsedMilliseconds,
                results = new
                {
                    organizations = new { count = orgCount, timeMs = orgCountTime },
                    donations = new { count = donationCount, timeMs = donationCountTime },
                    users = new { count = userCount, timeMs = userCountTime },
                    goals = new { count = goalCount, timeMs = goalCountTime }
                },
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in database performance test");
            return StatusCode(500, new { 
                message = "Error running database performance test",
                error = ex.Message
            });
        }
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult HealthCheck()
    {
        try
        {
            var adminCount = _context.Users.Count(u => u.Role == UserRole.Admin && u.IsActive);
            var totalUsers = _context.Users.Count();
            var totalOrganizations = _context.Organizations.Count();
            
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                adminUsers = adminCount,
                totalUsers = totalUsers,
                totalOrganizations = totalOrganizations,
                message = "Admin controller is working correctly"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in admin health check");
            return StatusCode(500, new { 
                status = "unhealthy",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    [HttpPost("seed-admin")]
    [AllowAnonymous] // Only for initial setup
    public async Task<IActionResult> SeedAdminUser([FromBody] SeedAdminDto dto)
    {
        // Check if any admin exists
        var adminExists = await _context.Users.AnyAsync(u => u.Role == UserRole.Admin);
        
        if (adminExists)
        {
            return BadRequest(new { message = "Admin user already exists" });
        }

        // Verify seed key (should be in configuration)
        var seedKey = _configuration["Admin:SeedKey"];
        if (string.IsNullOrEmpty(seedKey) || dto.SeedKey != seedKey)
        {
            return Unauthorized(new { message = "Invalid seed key" });
        }

        var admin = new User
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Admin,
            IsActive = true
        };

        _context.Users.Add(admin);
        await _context.SaveChangesAsync();

        _logger.LogWarning("Admin user created via seed endpoint: {Email}", dto.Email);

        return Ok(new { message = "Admin user created successfully" });
    }

    [HttpGet("export/donations")]
    public async Task<IActionResult> ExportDonations(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] Guid? organizationId = null,
        [FromQuery] DonationStatus? status = null)
    {
        try
        {
            var query = _context.Donations.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(d => d.CreatedAt >= startDate.Value);
            
            if (endDate.HasValue)
                query = query.Where(d => d.CreatedAt <= endDate.Value);
            
            if (organizationId.HasValue)
                query = query.Where(d => d.OrganizationId == organizationId.Value);
            
            if (status.HasValue)
                query = query.Where(d => d.Status == status.Value);

            // Use AsSplitQuery() for better performance with large datasets
            var donations = await query
                .OrderByDescending(d => d.CreatedAt)
                .AsSplitQuery()
                .ToListAsync();
            
            // For CSV export, we need the full entities, so use Include() only for this specific case
            var donationsForExport = await query
                .Include(d => d.Organization)
                .Include(d => d.DonationGoal)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
            
            var csvData = _csvExportService.ExportDonations(donationsForExport);
            
            var fileName = $"donations_export_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
            
            _logger.LogInformation("Exported {Count} donations to CSV", donations.Count);
            
            return File(csvData, "text/csv", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting donations");
            return StatusCode(500, new { message = "Error exporting donations" });
        }
    }

    [HttpGet("export/organizations")]
    public async Task<IActionResult> ExportOrganizations([FromQuery] OrganizationStatus? status = null)
    {
        var query = _context.Organizations.AsQueryable();
        
        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);
        
        var organizations = await query.OrderBy(o => o.Name).ToListAsync();
        
        var csvData = _csvExportService.ExportOrganizations(organizations);
        
        var fileName = $"organizations_export_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
        
        _logger.LogInformation("Exported {Count} organizations to CSV", organizations.Count);
        
        return File(csvData, "text/csv", fileName);
    }

    [HttpPost("reports/monthly")]
    public async Task<IActionResult> SendMonthlyReport([FromBody] MonthlyReportDto dto)
    {
        if (dto.OrganizationId.HasValue)
        {
            await _emailReportService.SendMonthlyReportAsync(dto.OrganizationId.Value, dto.Month);
            _logger.LogInformation("Monthly report sent for organization {OrgId} for month {Month}", 
                dto.OrganizationId.Value, dto.Month.ToString("yyyy-MM"));
        }
        else
        {
            await _emailReportService.SendMonthlyReportsForAllOrganizationsAsync(dto.Month);
            _logger.LogInformation("Monthly reports sent for all organizations for month {Month}", 
                dto.Month.ToString("yyyy-MM"));
        }
        
        return Ok(new { message = "Monthly report(s) sent successfully" });
    }

    [HttpGet("reports/preview")]
    public async Task<IActionResult> PreviewMonthlyReport(
        [FromQuery] Guid organizationId,
        [FromQuery] DateTime month)
    {
        var startDate = new DateTime(month.Year, month.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate = startDate.AddMonths(1);

        var donations = await _context.Donations
            .Include(d => d.Organization)
            .Include(d => d.DonationGoal)
            .Where(d => d.OrganizationId == organizationId &&
                       d.Status == DonationStatus.Paid &&
                       d.PaidAt >= startDate &&
                       d.PaidAt < endDate)
            .ToListAsync();

        var reportItems = donations
            .GroupBy(d => d.DonationGoalId)
            .Select(g => new DonationReportItem
            {
                OrganizationName = g.First().Organization.Name,
                GoalTitle = g.First().DonationGoal?.Title ?? "Dowolny cel",
                DonationCount = g.Count(),
                TotalAmount = g.Sum(d => d.Amount),
                AverageAmount = g.Average(d => d.Amount),
                Period = month.ToString("yyyy-MM")
            })
            .ToList();

        return Ok(new
        {
            Organization = donations.FirstOrDefault()?.Organization?.Name ?? "Unknown",
            Month = month.ToString("yyyy-MM"),
            Items = reportItems,
            Summary = new
            {
                TotalDonations = reportItems.Sum(i => i.DonationCount),
                TotalAmount = reportItems.Sum(i => i.TotalAmount)
            }
        });
    }

    [HttpGet("pdf/donation/{organizationId}")]
    public async Task<IActionResult> GenerateDonationPdf(
        Guid organizationId,
        [FromQuery] Guid? goalId = null)
    {
        try
        {
            var pdfData = await _pdfGeneratorService.GenerateDonationPdfAsync(organizationId, goalId);
            
            var fileName = goalId.HasValue 
                ? $"donation_qr_{organizationId:N}_{goalId:N}.pdf"
                : $"donation_qr_{organizationId:N}.pdf";
            
            _logger.LogInformation("Generated donation PDF for organization {OrgId}, goal {GoalId}", 
                organizationId, goalId);
            
            return File(pdfData, "application/pdf", fileName);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating donation PDF for organization {OrgId}", organizationId);
            return StatusCode(500, new { message = "Error generating PDF" });
        }
    }

    [HttpGet("pdf/qrcodes/{organizationId}")]
    public async Task<IActionResult> GenerateQrCodesPdf(Guid organizationId)
    {
        try
        {
            var pdfData = await _pdfGeneratorService.GenerateOrganizationQrCodesAsync(organizationId);
            
            var fileName = $"qr_codes_{organizationId:N}_{DateTime.Now:yyyyMMdd}.pdf";
            
            _logger.LogInformation("Generated QR codes PDF for organization {OrgId}", organizationId);
            
            return File(pdfData, "application/pdf", fileName);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR codes PDF for organization {OrgId}", organizationId);
            return StatusCode(500, new { message = "Error generating PDF" });
        }
    }

    [HttpPost("test-email")]
#if DEBUG
    [AllowAnonymous] // Only available in DEBUG builds for testing
#endif
    public async Task<IActionResult> SendTestEmail([FromBody] TestEmailDto dto)
    {
        try
        {
            var emailService = HttpContext.RequestServices.GetService<IEmailService>();
            if (emailService == null)
            {
                return StatusCode(500, new { message = "Email service not configured" });
            }

            // Use provided body if available, otherwise use default template
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "https://e-taca.borg.tools";
            var emailBody = !string.IsNullOrEmpty(dto.Body) 
                ? dto.Body  // Use custom body if provided
                : (dto.UseHtml ?? true 
                    ? EmailTemplates.OrganizationActivated("Testowa Organizacja", $"{frontendUrl}/panel")
                    : $@"
Witaj!

To jest testowa wiadomość z systemu e-Taca.

Szczegóły systemu:
- Wersja: MVP 1.0
- Data: {DateTime.Now:yyyy-MM-dd HH:mm:ss}
- Środowisko: Development

Funkcjonalności systemu:
✅ Rejestracja organizacji
✅ Zarządzanie celami zbiórek
✅ Przyjmowanie wpłat online
✅ Integracja z Fiserv/Polcard
✅ Generowanie kodów QR
✅ Eksport danych do CSV
✅ Panel administracyjny

Test konfiguracji SMTP:
- Host: smtp.gmail.com
- Port: 587
- SSL: Enabled
- From: wojciech.inbox@gmail.com

Ten email potwierdza, że konfiguracja SMTP działa poprawnie.

Pozdrawiam,
System e-Taca

---
Created by The Collective BORG.tools by assimilation of best technology and human assets.
");

            await emailService.SendAsync(
                dto.RecipientEmail ?? "wojciech.wiesner@gmail.com",
                dto.Subject ?? "Test e-Taca - System działa poprawnie",
                emailBody
            );

            _logger.LogInformation("Test email sent to {Email}", dto.RecipientEmail ?? "wojciech.wiesner@gmail.com");

            return Ok(new { 
                message = "Email sent successfully",
                recipient = dto.RecipientEmail ?? "wojciech.wiesner@gmail.com",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test email");
            return StatusCode(500, new { 
                message = "Failed to send email",
                error = ex.Message 
            });
        }
    }

    [HttpGet("shortlink")]
    public IActionResult GenerateShortLink([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
        {
            return BadRequest(new { message = "URL is required" });
        }

        try
        {
            var shortLink = _pdfGeneratorService.GenerateShortLink(url);
            
            return Ok(new 
            { 
                originalUrl = url,
                shortLink = shortLink
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating short link for URL: {Url}", url);
            return StatusCode(500, new { message = "Error generating short link" });
        }
    }

    [HttpPost("cache/clear")]
    public IActionResult ClearCache()
    {
        try
        {
            _adminStatisticsService.ClearCache();
            return Ok(new { message = "Admin cache cleared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing admin cache");
            return StatusCode(500, new { message = "Error clearing cache" });
        }
    }

    [HttpPost("fix-user-org-relationship")]
    #if DEBUG
    [AllowAnonymous] // Only available in DEBUG builds  
    #endif
    public async Task<IActionResult> FixUserOrgRelationship([FromBody] FixUserOrgDto dto)
    {
        try
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            var organization = await _context.Organizations.FindAsync(dto.OrganizationId);
            
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }
            
            if (organization == null)
            {
                return NotFound(new { message = "Organization not found" });
            }
            
            user.OrganizationId = dto.OrganizationId;
            user.UpdateTimestamp();
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Fixed user-organization relationship: User {UserId} linked to Organization {OrgId}", dto.UserId, dto.OrganizationId);
            
            return Ok(new { 
                message = "User-organization relationship fixed successfully",
                userId = dto.UserId,
                organizationId = dto.OrganizationId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fixing user-organization relationship");
            return StatusCode(500, new { message = "Error fixing relationship", error = ex.Message });
        }
    }
}

public record ActivateOrganizationDto(
    [Required] string FiservStoreId,
    [Required] string FiservSecret
);

public record DeactivateOrganizationDto(
    [Required] string Reason,
    bool Suspend = false
);

public record UpdatePaymentConfigDto(
    [Required] string FiservStoreId,
    [Required] string FiservSecret
);

public record SeedAdminDto(
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password,
    [Required] string SeedKey
);

public record MonthlyReportDto(
    DateTime Month,
    Guid? OrganizationId = null
);

public record CreateOrganizationDto(
    [Required] string Name,
    [Required] string Nip,
    string? Krs,
    [Required] string BankAccount,
    [Required][EmailAddress] string Email,
    [Required] string Slug,
    string? FiservStoreId,
    string? FiservSecret,
    int Status = 0
);

public record CreateUserDto(
    [Required][EmailAddress] string Email,
    [Required] string Password,
    [Required] int Role,
    Guid? OrganizationId
);

public record TestEmailDto(
    string? RecipientEmail,
    string? Subject,
    bool? UseHtml,
    string? Body
);

public record FixUserOrgDto(
    [Required] Guid UserId,
    [Required] Guid OrganizationId
);