using Asp.Versioning;
using ETaca.API.DTOs;
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
public class DonationsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ETacaDbContext _context;
    private readonly ILogger<DonationsController> _logger;
    private readonly ICaptchaService _captchaService;

    public DonationsController(
        IPaymentService paymentService, 
        ETacaDbContext context, 
        ILogger<DonationsController> logger,
        ICaptchaService captchaService)
    {
        _paymentService = paymentService;
        _context = context;
        _logger = logger;
        _captchaService = captchaService;
    }

    [HttpPost("initiate")]
    public async Task<IActionResult> InitiateDonation([FromBody] InitiateDonationDto dto)
    {
        try
        {
            // Captcha temporarily disabled for MVP testing
            // TODO: Re-enable captcha for production
            // var clientIp = GetClientIpAddress();
            // var captchaValid = await _captchaService.VerifyAsync(dto.CaptchaToken, clientIp);
            // 
            // if (!captchaValid)
            // {
            //     return BadRequest(new { message = "Invalid or missing captcha verification" });
            // }
            
            var result = await _paymentService.InitiateDonationAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating donation");
            return StatusCode(500, new { message = "An error occurred while initiating donation" });
        }
    }
    
    private string GetClientIpAddress()
    {
        var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> ProcessWebhook([FromForm] IFormCollection form)
    {
        try
        {
            var payload = new WebhookPayloadDto
            {
                Oid = form["oid"],
                Status = form["status"],
                Amount = form["amount"],
                Currency = form["currency"],
                Hash = form["hash"],
                Storename = form["storename"],
                Txndatetime = form["txndatetime"],
                AllFields = form.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.ToString())
            };

            var success = await _paymentService.ProcessWebhookAsync(payload);
            
            // Always return 200 OK to acknowledge receipt
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing webhook");
            // Still return 200 to prevent webhook retries
            return Ok();
        }
    }

    [HttpGet("organization/{organizationId}")]
    [Authorize]
    public async Task<IActionResult> GetOrganizationDonations(Guid organizationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        // Check authorization
        var userOrgId = User.FindFirst("OrganizationId")?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (userRole != "Admin" && userOrgId != organizationId.ToString())
        {
            return Forbid();
        }

        var query = _context.Donations
            .Where(d => d.OrganizationId == organizationId)
            .OrderByDescending(d => d.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalAmount = await query
            .Where(d => d.Status == DonationStatus.Paid)
            .SumAsync(d => d.Amount);

        var donations = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DonationDto(
                d.Id,
                d.OrganizationId,
                d.DonationGoalId,
                d.ExternalRef,
                d.Amount,
                d.DonorEmail,
                d.DonorName,
                d.Status.ToString(),
                d.CreatedAt,
                d.PaidAt
            ))
            .ToListAsync();

        return Ok(new DonationListDto(donations, totalCount, totalAmount, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDonation(Guid id)
    {
        var donation = await _context.Donations
            .Where(d => d.Id == id)
            .Select(d => new DonationDto(
                d.Id,
                d.OrganizationId,
                d.DonationGoalId,
                d.ExternalRef,
                d.Amount,
                d.DonorEmail,
                d.DonorName,
                d.Status.ToString(),
                d.CreatedAt,
                d.PaidAt
            ))
            .FirstOrDefaultAsync();

        if (donation == null)
        {
            return NotFound();
        }

        return Ok(donation);
    }

    [HttpGet("status/{externalRef}")]
    public async Task<IActionResult> GetDonationStatus(string externalRef)
    {
        var donation = await _context.Donations
            .Where(d => d.ExternalRef == externalRef)
            .Select(d => new { d.Status, d.PaidAt })
            .FirstOrDefaultAsync();

        if (donation == null)
        {
            return NotFound();
        }

        return Ok(donation);
    }
}
