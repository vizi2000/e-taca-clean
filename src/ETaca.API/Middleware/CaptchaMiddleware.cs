using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace ETaca.API.Middleware;

public class CaptchaMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CaptchaMiddleware> _logger;
    private readonly IConfiguration _configuration;

    public CaptchaMiddleware(
        RequestDelegate next,
        IMemoryCache cache,
        ILogger<CaptchaMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only check CAPTCHA for login endpoint
        if (context.Request.Path.StartsWithSegments("/api/v1.0/auth/login") && 
            HttpMethods.IsPost(context.Request.Method))
        {
            var ipAddress = GetClientIpAddress(context);
            var failedAttemptsKey = $"failed_login_attempts_{ipAddress}";
            var captchaRequiredKey = $"captcha_required_{ipAddress}";
            
            // Check if CAPTCHA is required for this IP
            var captchaRequired = await _cache.GetOrCreateAsync(captchaRequiredKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
                return false;
            });

            if (captchaRequired)
            {
                // Check for CAPTCHA token in request header
                var captchaToken = context.Request.Headers["X-Captcha-Token"].FirstOrDefault();
                
                if (string.IsNullOrEmpty(captchaToken))
                {
                    _logger.LogWarning("CAPTCHA required but not provided for IP: {IpAddress}", ipAddress);
                    
                    context.Response.StatusCode = 429;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        error = "Captcha Required",
                        message = "Zbyt wiele nieudanych prób. Proszę rozwiązać CAPTCHA.",
                        captchaRequired = true
                    }));
                    return;
                }
                
                // In production, validate CAPTCHA with external service
                // For now, we'll accept any non-empty token
                if (captchaToken.Length < 10)
                {
                    _logger.LogWarning("Invalid CAPTCHA token from IP: {IpAddress}", ipAddress);
                    
                    context.Response.StatusCode = 400;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        error = "Invalid Captcha",
                        message = "Nieprawidłowa CAPTCHA. Spróbuj ponownie.",
                        captchaRequired = true
                    }));
                    return;
                }
                
                // CAPTCHA validated successfully, reset the requirement
                _cache.Remove(captchaRequiredKey);
                _cache.Remove(failedAttemptsKey);
                _logger.LogInformation("CAPTCHA validated successfully for IP: {IpAddress}", ipAddress);
            }
            
            // Track failed login attempts
            context.Response.OnStarting(async () =>
            {
                // If response is 401 (unauthorized), increment failed attempts
                if (context.Response.StatusCode == 401)
                {
                    var attempts = _cache.Get<int>(failedAttemptsKey);
                    attempts++;
                    
                    _cache.Set(failedAttemptsKey, attempts, TimeSpan.FromMinutes(15));
                    
                    // Require CAPTCHA after 3 failed attempts
                    if (attempts >= 3)
                    {
                        _cache.Set(captchaRequiredKey, true, TimeSpan.FromMinutes(30));
                        _logger.LogWarning("CAPTCHA required after {Attempts} failed attempts from IP: {IpAddress}", 
                            attempts, ipAddress);
                        
                        // Add header to indicate CAPTCHA is required
                        context.Response.Headers.Append("X-Captcha-Required", "true");
                    }
                    
                    // Add remaining attempts header
                    var remainingAttempts = Math.Max(0, 3 - attempts);
                    context.Response.Headers.Append("X-Login-Attempts-Remaining", remainingAttempts.ToString());
                }
                // Reset on successful login
                else if (context.Response.StatusCode == 200)
                {
                    _cache.Remove(failedAttemptsKey);
                    _cache.Remove(captchaRequiredKey);
                }
            });
        }

        await _next(context);
    }

    private string GetClientIpAddress(HttpContext context)
    {
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

public static class CaptchaMiddlewareExtensions
{
    public static IApplicationBuilder UseCaptchaProtection(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CaptchaMiddleware>();
    }
}