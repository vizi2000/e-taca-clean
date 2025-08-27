using System.ComponentModel.DataAnnotations;

namespace ETaca.API.DTOs;

public record LoginDto(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record RegisterOrganizationDto(
    [Required][MaxLength(200)] string Name,
    [Required][RegularExpression(@"^\d{10}$", ErrorMessage = "NIP must be 10 digits")] string Nip,
    [MaxLength(10)] string? Krs,
    [Required][RegularExpression(@"^\d{26}$", ErrorMessage = "Bank account must be 26 digits")] string BankAccount,
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password,
    [Required][EmailAddress] string AdminEmail
);

public record TokenResponseDto(
    string Token,
    string Email,
    string Role,
    Guid? OrganizationId,
    DateTime ExpiresAt
);

public record ChangePasswordDto(
    [Required] string CurrentPassword,
    [Required][MinLength(8)] string NewPassword
);

public record RequestPasswordResetDto(
    [Required][EmailAddress] string Email
);

public record PerformPasswordResetDto(
    [Required] string Token,
    [Required][MinLength(8)] string NewPassword
);

public record InviteUserDto(
    [Required] Guid OrganizationId,
    [Required][EmailAddress] string Email,
    [MaxLength(200)] string? Name
);

public record AcceptInviteDto(
    [Required] string Token,
    [Required][MinLength(8)] string NewPassword
);