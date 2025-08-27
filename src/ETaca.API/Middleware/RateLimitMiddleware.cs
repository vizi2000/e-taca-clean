using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Text.Json;

namespace ETaca.API.Middleware;

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<RateLimitMiddleware> _logger;
    private readonly IConfiguration _configuration;
    private readonly Dictionary<string, RateLimitConfig> _endpointLimits;

    public RateLimitMiddleware(
        RequestDelegate next, 
        IMemoryCache cache,
        ILogger<RateLimitMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
        _endpointLimits = InitializeEndpointLimits();
    }

    private Dictionary<string, RateLimitConfig> InitializeEndpointLimits()
    {
        return new Dictionary<string, RateLimitConfig>
        {
            // Authentication endpoints - stricter limits
            { "/api/v1.0/auth/login", new RateLimitConfig(5, 1) },
            { "/api/v1.0/auth/register", new RateLimitConfig(3, 5) },
            { "/api/v1.0/auth/request-password-reset", new RateLimitConfig(3, 15) },
            
            // Donation endpoints - moderate limits
            { "/api/v1.0/donations/initiate", new RateLimitConfig(10, 1) },
            { "/api/v1.0/donations/webhook", new RateLimitConfig(50, 1) },
            
            // Admin endpoints - relaxed limits for authenticated users
            { "/api/v1.0/admin", new RateLimitConfig(30, 1) },
            
            // Default for all other endpoints
            { "default", new RateLimitConfig(60, 1) }
        };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip rate limiting for health checks
        if (context.Request.Path.StartsWithSegments("/api/health"))
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value?.ToLower() ?? "";
        var ipAddress = GetClientIpAddress(context);
        
        // Find matching rate limit config
        var config = GetRateLimitConfig(path);
        var key = $"rate_limit_{ipAddress}_{path}";
        
        var requestCount = await _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(config.WindowMinutes);
            return 0;
        });

        if (requestCount >= config.RequestLimit)
        {
            _logger.LogWarning("Rate limit exceeded for IP: {IpAddress} on path: {Path}", ipAddress, path);
            
            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.ContentType = "application/json";
            context.Response.Headers.Append("X-RateLimit-Limit", config.RequestLimit.ToString());
            context.Response.Headers.Append("X-RateLimit-Remaining", "0");
            context.Response.Headers.Append("X-RateLimit-Reset", DateTimeOffset.UtcNow.AddMinutes(config.WindowMinutes).ToUnixTimeSeconds().ToString());
            context.Response.Headers.Append("Retry-After", (config.WindowMinutes * 60).ToString());
            
            var response = new
            {
                error = "Too Many Requests",
                message = $"Rate limit exceeded. Please try again in {config.WindowMinutes} minute(s).",
                retryAfter = config.WindowMinutes * 60
            };
            
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            return;
        }

        // Increment the request count
        _cache.Set(key, requestCount + 1, TimeSpan.FromMinutes(config.WindowMinutes));
        
        // Add rate limit headers to response
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.Append("X-RateLimit-Limit", config.RequestLimit.ToString());
            context.Response.Headers.Append("X-RateLimit-Remaining", (config.RequestLimit - requestCount - 1).ToString());
            context.Response.Headers.Append("X-RateLimit-Reset", DateTimeOffset.UtcNow.AddMinutes(config.WindowMinutes).ToUnixTimeSeconds().ToString());
            return Task.CompletedTask;
        });

        await _next(context);
    }

    private RateLimitConfig GetRateLimitConfig(string path)
    {
        // Check for exact match first
        foreach (var endpoint in _endpointLimits.Keys.Where(k => k != "default"))
        {
            if (path.StartsWith(endpoint, StringComparison.OrdinalIgnoreCase))
            {
                return _endpointLimits[endpoint];
            }
        }
        
        // Return default config
        return _endpointLimits["default"];
    }

    private string GetClientIpAddress(HttpContext context)
    {
        // Check for proxy headers first
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

        // Fall back to remote IP address
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
    
    private class RateLimitConfig
    {
        public int RequestLimit { get; }
        public int WindowMinutes { get; }
        
        public RateLimitConfig(int requestLimit, int windowMinutes)
        {
            RequestLimit = requestLimit;
            WindowMinutes = windowMinutes;
        }
    }
}