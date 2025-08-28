using Asp.Versioning;
using ETaca.API.DTOs;
using ETaca.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ETaca.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        // Get client IP address for audit logging
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            ipAddress = forwardedFor.Split(',')[0].Trim();
        }
        
        // Create a new DTO with IP address
        var loginDtoWithIp = dto with { ClientIpAddress = ipAddress };
        
        var result = await _authService.LoginAsync(loginDtoWithIp);
        
        if (result == null)
        {
            // Generic error message to prevent user enumeration
            return Unauthorized(new { message = "Nieprawidłowe dane logowania" });
        }

        // Set JWT token as httpOnly cookie instead of returning in body
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Always use HTTPS in production
            SameSite = SameSiteMode.Strict,
            Expires = result.ExpiresAt
        };
        
        Response.Cookies.Append("auth-token", result.Token, cookieOptions);
        
        // Return user info without token
        return Ok(new 
        { 
            email = result.Email, 
            role = result.Role, 
            organizationId = result.OrganizationId,
            expiresAt = result.ExpiresAt
        });
    }

    [HttpPost("register-organization")]
    public async Task<IActionResult> RegisterOrganization([FromBody] RegisterOrganizationDto dto)
    {
        var (success, message, organizationId) = await _authService.RegisterOrganizationAsync(dto);
        
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message, organizationId });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // Clear the auth cookie
        Response.Cookies.Delete("auth-token");
        
        // Log the logout event
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        _logger.LogInformation("User logged out: {Email}", email);
        
        return Ok(new { message = "Wylogowano pomyślnie" });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var organizationId = User.FindFirst("OrganizationId")?.Value;

        return Ok(new
        {
            userId,
            email,
            role,
            organizationId = string.IsNullOrEmpty(organizationId) ? null : organizationId
        });
    }

    [HttpPost("request-password-reset")]
    public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetDto dto)
    {
        var (success, message) = await _authService.RequestPasswordResetAsync(dto);
        
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message });
    }

    [HttpPost("perform-password-reset")]
    public async Task<IActionResult> PerformPasswordReset([FromBody] PerformPasswordResetDto dto)
    {
        var (success, message) = await _authService.PerformPasswordResetAsync(dto);
        
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message });
    }

    [HttpPost("invite")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> InviteUser([FromBody] InviteUserDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (!Guid.TryParse(userId, out var requestingUserId))
        {
            return Unauthorized();
        }

        var (success, message) = await _authService.InviteUserAsync(dto, requestingUserId);
        
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message });
    }

    [HttpPost("accept-invite")]
    public async Task<IActionResult> AcceptInvite([FromBody] AcceptInviteDto dto)
    {
        var (success, message) = await _authService.AcceptInviteAsync(dto);
        
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message });
    }
}
