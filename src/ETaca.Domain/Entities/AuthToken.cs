using System;
using ETaca.Domain.Shared;

namespace ETaca.Domain.Entities;

public enum AuthTokenType 
{ 
    ResetPassword, 
    Invitation 
}

public class AuthToken : Entity
{
    public Guid UserId { get; set; }
    public AuthTokenType Type { get; set; }
    public string Token { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; }
    
    public User User { get; set; } = default!;
}