using Asp.Versioning;
using ETaca.Domain.Entities;
using ETaca.Domain.Enums;
using ETaca.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace ETaca.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/organizations/{organizationId}/[controller]")]
[ApiVersion("1.0")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly ETacaDbContext _context;
    private readonly ILogger<GoalsController> _logger;

    public GoalsController(ETacaDbContext context, ILogger<GoalsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetGoals(Guid organizationId, [FromQuery] bool includeInactive = false)
    {
        var query = _context.DonationGoals.Where(g => g.OrganizationId == organizationId);
        
        // For public access, only show active goals
        // For authenticated admin access, show all goals if requested
        if (!includeInactive)
        {
            query = query.Where(g => g.IsActive);
        }
        
        var goals = await query
            .Select(g => new GoalDto(
                g.Id,
                g.Title,
                g.Description,
                g.TargetAmount,
                g.Slug,
                g.ImageUrl,
                g.Donations.Where(d => d.Status == DonationStatus.Paid).Sum(d => d.Amount),
                g.Donations.Count(d => d.Status == DonationStatus.Paid),
                g.IsActive
            ))
            .ToListAsync();

        return Ok(goals);
    }

    [HttpPost]
    public async Task<IActionResult> CreateGoal(Guid organizationId, [FromBody] CreateGoalDto dto)
    {
        // Check authorization
        var userOrgId = User.FindFirst("OrganizationId")?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (userRole != "Admin" && userOrgId != organizationId.ToString())
        {
            return Forbid();
        }

        // Check if organization has less than 3 goals (MVP limit)
        var goalCount = await _context.DonationGoals
            .CountAsync(g => g.OrganizationId == organizationId && g.IsActive);
        
        if (goalCount >= 3)
        {
            return BadRequest(new { message = "Organization can have maximum 3 active goals" });
        }

        var goal = new DonationGoal
        {
            OrganizationId = organizationId,
            Title = dto.Title,
            Description = dto.Description,
            TargetAmount = dto.TargetAmount,
            Slug = GenerateSlug(dto.Title),
            ImageUrl = dto.ImageUrl,
            IsActive = true
        };

        _context.DonationGoals.Add(goal);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Goal created: {GoalId} for organization {OrgId}", goal.Id, organizationId);

        return CreatedAtAction(nameof(GetGoal), new { organizationId, id = goal.Id }, goal);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGoal(Guid organizationId, Guid id)
    {
        var goal = await _context.DonationGoals
            .Where(g => g.Id == id && g.OrganizationId == organizationId)
            .Select(g => new GoalDto(
                g.Id,
                g.Title,
                g.Description,
                g.TargetAmount,
                g.Slug,
                g.ImageUrl,
                g.Donations.Where(d => d.Status == DonationStatus.Paid).Sum(d => d.Amount),
                g.Donations.Count(d => d.Status == DonationStatus.Paid),
                g.IsActive
            ))
            .FirstOrDefaultAsync();

        if (goal == null)
        {
            return NotFound();
        }

        return Ok(goal);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGoal(Guid organizationId, Guid id, [FromBody] UpdateGoalDto dto)
    {
        // Check authorization
        var userOrgId = User.FindFirst("OrganizationId")?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (userRole != "Admin" && userOrgId != organizationId.ToString())
        {
            return Forbid();
        }

        var goal = await _context.DonationGoals
            .FirstOrDefaultAsync(g => g.Id == id && g.OrganizationId == organizationId);

        if (goal == null)
        {
            return NotFound();
        }

        if (!string.IsNullOrEmpty(dto.Title))
            goal.Title = dto.Title;
        if (!string.IsNullOrEmpty(dto.Description))
            goal.Description = dto.Description;
        if (dto.TargetAmount.HasValue)
            goal.TargetAmount = dto.TargetAmount.Value;
        if (dto.ImageUrl != null)
            goal.ImageUrl = dto.ImageUrl;
        if (dto.IsActive.HasValue)
            goal.IsActive = dto.IsActive.Value;

        goal.UpdateTimestamp();
        await _context.SaveChangesAsync();

        return Ok(goal);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGoal(Guid organizationId, Guid id)
    {
        // Check authorization
        var userOrgId = User.FindFirst("OrganizationId")?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (userRole != "Admin" && userOrgId != organizationId.ToString())
        {
            return Forbid();
        }

        var goal = await _context.DonationGoals
            .FirstOrDefaultAsync(g => g.Id == id && g.OrganizationId == organizationId);

        if (goal == null)
        {
            return NotFound();
        }

        // Soft delete - just mark as inactive
        goal.IsActive = false;
        goal.UpdateTimestamp();
        await _context.SaveChangesAsync();

        _logger.LogInformation("Goal deactivated: {GoalId}", id);

        return NoContent();
    }

    private string GenerateSlug(string title)
    {
        var slug = title.ToLower()
            .Replace(" ", "-")
            .Replace("ą", "a").Replace("ć", "c").Replace("ę", "e")
            .Replace("ł", "l").Replace("ń", "n").Replace("ó", "o")
            .Replace("ś", "s").Replace("ź", "z").Replace("ż", "z");
        
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-").Trim('-');
        
        return slug;
    }
}

public record GoalDto(
    Guid Id,
    string Title,
    string Description,
    decimal? TargetAmount,
    string Slug,
    string? ImageUrl,
    decimal CollectedAmount,
    int DonationCount,
    bool IsActive
);

public record CreateGoalDto(
    [Required][MaxLength(200)] string Title,
    [Required][MaxLength(2000)] string Description,
    [Range(1, 1000000)] decimal? TargetAmount,
    string? ImageUrl
);

public record UpdateGoalDto(
    string? Title,
    string? Description,
    decimal? TargetAmount,
    string? ImageUrl,
    bool? IsActive
);
