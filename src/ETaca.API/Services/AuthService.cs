using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ETaca.API.DTOs;
using ETaca.Domain.Entities;
using ETaca.Domain.Enums;
using ETaca.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ETaca.API.Services;

public interface IAuthService
{
    Task<TokenResponseDto?> LoginAsync(LoginDto dto);
    Task<(bool Success, string Message, Guid? OrganizationId)> RegisterOrganizationAsync(RegisterOrganizationDto dto);
    Task<(bool Success, string Message)> RequestPasswordResetAsync(RequestPasswordResetDto dto);
    Task<(bool Success, string Message)> PerformPasswordResetAsync(PerformPasswordResetDto dto);
    Task<(bool Success, string Message)> InviteUserAsync(InviteUserDto dto, Guid requestingUserId);
    Task<(bool Success, string Message)> AcceptInviteAsync(AcceptInviteDto dto);
    string GenerateJwtToken(User user);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}

public class AuthService : IAuthService
{
    private readonly ETacaDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly IEmailService _emailService;

    public AuthService(ETacaDbContext context, IConfiguration configuration, ILogger<AuthService> logger, IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<TokenResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);

        if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
        {
            // Log failed attempt for audit trail
            _logger.LogWarning("Failed login attempt for email: {Email} from IP: {IP}", 
                dto.Email, dto.ClientIpAddress ?? "unknown");
            return null;
        }
        
        // Migrate SHA256 passwords to BCrypt on successful login
        if (!user.PasswordHash.StartsWith("$2"))
        {
            _logger.LogInformation("Migrating password from SHA256 to BCrypt for user {Email}", user.Email);
            user.PasswordHash = HashPassword(dto.Password);
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Log successful login for audit trail
        _logger.LogInformation("Successful login for user: {Email} (ID: {UserId}) from IP: {IP}", 
            user.Email, user.Id, dto.ClientIpAddress ?? "unknown");

        var token = GenerateJwtToken(user);
        var expirationMinutes = _configuration.GetValue<int>("Jwt:ExpirationMinutes", 1440);

        return new TokenResponseDto(
            token,
            user.Email,
            user.Role.ToString(),
            user.OrganizationId,
            DateTime.UtcNow.AddMinutes(expirationMinutes)
        );
    }

    public async Task<(bool Success, string Message, Guid? OrganizationId)> RegisterOrganizationAsync(RegisterOrganizationDto dto)
    {
        // Check if organization with NIP already exists
        if (await _context.Organizations.AnyAsync(o => o.Nip == dto.Nip))
        {
            return (false, "Organization with this NIP already exists", null);
        }

        // Check if user with email already exists
        if (await _context.Users.AnyAsync(u => u.Email == dto.AdminEmail))
        {
            return (false, "User with this email already exists", null);
        }

        // Generate slug before starting transaction
        var slug = GenerateSlug(dto.Name);
        
        // Use the execution strategy for the entire operation
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create organization
                var organization = new Organization
                {
                    Name = dto.Name,
                    Nip = dto.Nip,
                    Krs = dto.Krs,
                    BankAccount = dto.BankAccount,
                    Email = dto.Email,
                    Status = OrganizationStatus.Pending,
                    Slug = slug
                };

                _context.Organizations.Add(organization);

                // Create admin user
                var user = new User
                {
                    Email = dto.AdminEmail,
                    PasswordHash = HashPassword(dto.Password),
                    Role = UserRole.OrgOwner,
                    OrganizationId = organization.Id,
                    IsActive = true
                };

                _context.Users.Add(user);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("New organization registered: {Name} (ID: {Id})", organization.Name, organization.Id);

                return (true, "Organization registered successfully. Awaiting activation.", organization.Id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error registering organization");
                return (false, "An error occurred during registration", Guid.Empty);
            }
        });
    }

    public string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
        {
            _logger.LogError("JWT Key is not configured or is too short. Please set a secure key of at least 32 characters in configuration.");
            throw new InvalidOperationException("JWT Key is not configured correctly.");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expirationMinutes = _configuration.GetValue<int>("Jwt:ExpirationMinutes", 1440);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("OrganizationId", user.OrganizationId?.ToString() ?? "")
        };

        var token = new JwtSecurityToken(
            _configuration["Jwt:Issuer"],
            _configuration["Jwt:Audience"],
            claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hash)
    {
        // Check if it's a BCrypt hash (starts with $2a$, $2b$, or $2y$)
        if (hash.StartsWith("$2"))
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        
        // Otherwise, assume it's a SHA256 hash (legacy format)
        return VerifySha256Password(password, hash);
    }
    
    private bool VerifySha256Password(string password, string sha256Hash)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        var computedHash = Convert.ToBase64String(hashedBytes);
        return computedHash == sha256Hash;
    }

    private string GenerateSlug(string name)
    {
        var slug = name.ToLower()
            .Replace(" ", "-")
            .Replace("ą", "a").Replace("ć", "c").Replace("ę", "e")
            .Replace("ł", "l").Replace("ń", "n").Replace("ó", "o")
            .Replace("ś", "s").Replace("ź", "z").Replace("ż", "z");
        
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-").Trim('-');
        
        // Ensure uniqueness
        var baseSlug = slug;
        var counter = 1;
        while (_context.Organizations.Any(o => o.Slug == slug))
        {
            slug = $"{baseSlug}-{counter++}";
        }
        
        return slug;
    }

    public async Task<(bool Success, string Message)> RequestPasswordResetAsync(RequestPasswordResetDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        
        if (user == null)
        {
            // Don't reveal if user exists or not for security
            _logger.LogWarning("Password reset requested for non-existent email: {Email}", dto.Email);
            return (true, "If the email exists, a password reset link has been sent.");
        }

        // Invalidate any existing reset tokens
        var existingTokens = await _context.AuthTokens
            .Where(t => t.UserId == user.Id && t.Type == AuthTokenType.ResetPassword && !t.Used)
            .ToListAsync();
        
        foreach (var token in existingTokens)
        {
            token.Used = true;
        }

        // Create new reset token
        var resetToken = new AuthToken
        {
            UserId = user.Id,
            Type = AuthTokenType.ResetPassword,
            Token = TokenGenService.GenerateUrlSafeToken(),
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            Used = false
        };

        _context.AuthTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        // Send email
        var baseUrl = _configuration["Frontend:BaseUrl"] ?? "https://e-taca.borg.tools";
        var (subject, body) = Templates.EmailTemplates.GetPasswordResetEmail(baseUrl, resetToken.Token, user.Email);
        
        try
        {
            await _emailService.SendAsync(user.Email, subject, body);
            _logger.LogInformation("Password reset email sent to user {UserId}", user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to user {UserId}", user.Id);
        }

        return (true, "If the email exists, a password reset link has been sent.");
    }

    public async Task<(bool Success, string Message)> PerformPasswordResetAsync(PerformPasswordResetDto dto)
    {
        var token = await _context.AuthTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == dto.Token && t.Type == AuthTokenType.ResetPassword);

        if (token == null || token.Used || token.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Invalid or expired password reset token used");
            return (false, "Invalid or expired reset token");
        }

        // Reset password
        token.User.PasswordHash = HashPassword(dto.NewPassword);
        token.Used = true;

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Password reset successfully for user {UserId}", token.UserId);
        return (true, "Password has been reset successfully");
    }

    public async Task<(bool Success, string Message)> InviteUserAsync(InviteUserDto dto, Guid requestingUserId)
    {
        // Verify requesting user is admin
        var requestingUser = await _context.Users.FindAsync(requestingUserId);
        if (requestingUser?.Role != UserRole.Admin)
        {
            return (false, "Only administrators can invite users");
        }

        // Check if user already exists
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            return (false, "User with this email already exists");
        }

        // Verify organization exists
        var organization = await _context.Organizations.FindAsync(dto.OrganizationId);
        if (organization == null)
        {
            return (false, "Organization not found");
        }

        // Create invited user
        var invitedUser = new User
        {
            Email = dto.Email,
            PasswordHash = HashPassword(Guid.NewGuid().ToString()), // Temporary password
            Role = UserRole.OrgOwner,
            OrganizationId = dto.OrganizationId,
            IsActive = false // Will be activated when invitation is accepted
        };

        _context.Users.Add(invitedUser);

        // Create invitation token
        var inviteToken = new AuthToken
        {
            UserId = invitedUser.Id,
            Type = AuthTokenType.Invitation,
            Token = TokenGenService.GenerateUrlSafeToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Used = false
        };

        _context.AuthTokens.Add(inviteToken);
        await _context.SaveChangesAsync();

        // Send invitation email
        var baseUrl = _configuration["Frontend:BaseUrl"] ?? "https://e-taca.borg.tools";
        var (subject, body) = Templates.EmailTemplates.GetInvitationEmail(baseUrl, inviteToken.Token, organization.Name);
        
        try
        {
            await _emailService.SendAsync(dto.Email, subject, body);
            _logger.LogInformation("Invitation sent to {Email} for organization {OrganizationId}", dto.Email, dto.OrganizationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send invitation email to {Email}", dto.Email);
            return (false, "Failed to send invitation email");
        }

        return (true, "Invitation sent successfully");
    }

    public async Task<(bool Success, string Message)> AcceptInviteAsync(AcceptInviteDto dto)
    {
        var token = await _context.AuthTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == dto.Token && t.Type == AuthTokenType.Invitation);

        if (token == null || token.Used || token.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Invalid or expired invitation token used");
            return (false, "Invalid or expired invitation token");
        }

        // Activate user and set password
        token.User.PasswordHash = HashPassword(dto.NewPassword);
        token.User.IsActive = true;
        token.Used = true;

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Invitation accepted for user {UserId}", token.UserId);
        return (true, "Invitation accepted successfully. You can now login.");
    }
}