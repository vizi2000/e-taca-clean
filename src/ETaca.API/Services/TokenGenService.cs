using System;
using System.Security.Cryptography;

namespace ETaca.API.Services;

public static class TokenGenService
{
    public static string GenerateUrlSafeToken(int bytes = 32)
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(bytes);
        return Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}