namespace ETaca.Application.DTOs;

public class RegisterOrganizationRequest
{
    public string Nip { get; init; } = default!;
    public string Krs { get; init; } = default!;
    public string Name { get; init; } = default!;
    public string Iban { get; init; } = default!;
    public string AdminEmail { get; init; } = default!;
    public string AdminPassword { get; init; } = default!;
}