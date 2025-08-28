using Microsoft.AspNetCore.Antiforgery;

namespace ETaca.API.Middleware;

public class CsrfMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IAntiforgery _antiforgery;
    private readonly ILogger<CsrfMiddleware> _logger;

    public CsrfMiddleware(
        RequestDelegate next, 
        IAntiforgery antiforgery,
        ILogger<CsrfMiddleware> logger)
    {
        _next = next;
        _antiforgery = antiforgery;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Generate and set CSRF token for GET requests (initial page load)
        if (HttpMethods.IsGet(context.Request.Method) && 
            (context.Request.Path.StartsWithSegments("/api/v1.0/auth") || 
             context.Request.Path.StartsWithSegments("/api/v1.0/csrf")))
        {
            var tokens = _antiforgery.GetAndStoreTokens(context);
            context.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!,
                new CookieOptions
                {
                    HttpOnly = false, // Allow JavaScript to read
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    IsEssential = true
                });
        }

        // Validate CSRF token for state-changing operations
        if (HttpMethods.IsPost(context.Request.Method) ||
            HttpMethods.IsPut(context.Request.Method) ||
            HttpMethods.IsDelete(context.Request.Method) ||
            HttpMethods.IsPatch(context.Request.Method))
        {
            // Skip CSRF validation for webhook endpoints (external systems)
            if (context.Request.Path.StartsWithSegments("/api/v1.0/donations/webhook"))
            {
                await _next(context);
                return;
            }

            // Skip for health checks and other internal endpoints
            if (context.Request.Path.StartsWithSegments("/api/health"))
            {
                await _next(context);
                return;
            }

            try
            {
                await _antiforgery.ValidateRequestAsync(context);
            }
            catch (AntiforgeryValidationException ex)
            {
                _logger.LogWarning("CSRF validation failed for {Path} from IP {IpAddress}: {Message}", 
                    context.Request.Path, 
                    context.Connection.RemoteIpAddress,
                    ex.Message);
                    
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    System.Text.Json.JsonSerializer.Serialize(new
                    {
                        error = "Forbidden",
                        message = "Invalid or missing CSRF token"
                    }));
                return;
            }
        }

        await _next(context);
    }
}

public static class CsrfMiddlewareExtensions
{
    public static IApplicationBuilder UseCsrfProtection(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CsrfMiddleware>();
    }
}