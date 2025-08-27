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
        var result = await _authService.LoginAsync(dto);
        
        if (result == null)
        {
            _logger.LogWarning("Failed login attempt for email: {Email}", dto.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }

        _logger.LogInformation("Successful login for email: {Email}", dto.Email);
        return Ok(result);
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
