using Asp.Versioning;
using ETaca.API.Services;
using ETaca.Application.Services;
using ETaca.Infrastructure.Data;
using ETaca.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace ETaca.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Core application services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IQrCodeService, QrCodeService>();
        services.AddScoped<ICsvExportService, CsvExportService>();
        services.AddScoped<IEmailReportService, EmailReportService>();
        services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IAdminStatisticsService, AdminStatisticsService>();
        services.AddHttpClient<ICaptchaService, CaptchaService>();
        
        return services;
    }
    
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        // Repository pattern
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        return services;
    }
    
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        // RESTORED: PostgreSQL Database (AdminController hanging issue has been fixed)
        services.AddDbContext<ETacaDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Pg"), npgsqlOptions =>
            {
                var commandTimeout = configuration.GetValue<int>("Database:CommandTimeout", 30);
                var enableRetry = configuration.GetValue<bool>("Database:EnableRetryOnFailure", true);
                var maxRetryCount = configuration.GetValue<int>("Database:MaxRetryCount", 3);
                var maxRetryDelay = configuration.GetValue<int>("Database:MaxRetryDelay", 5);
                
                npgsqlOptions.CommandTimeout(commandTimeout);
                
                if (enableRetry)
                {
                    npgsqlOptions.EnableRetryOnFailure(
                        maxRetryCount: maxRetryCount,
                        maxRetryDelay: TimeSpan.FromSeconds(maxRetryDelay),
                        errorCodesToAdd: null);
                }
                
                // Performance optimizations
                npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
            })
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .EnableSensitiveDataLogging(configuration.GetValue<bool>("Database:EnableSensitiveDataLogging", false))
            .EnableServiceProviderCaching());
        
        // PREVIOUS IN-MEMORY CONFIG (no longer needed):
        /*
        services.AddDbContext<ETacaDbContext>(options =>
            options.UseInMemoryDatabase("ETacaInMemoryDb")
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .EnableSensitiveDataLogging(configuration.GetValue<bool>("Database:EnableSensitiveDataLogging", false))
            .EnableServiceProviderCaching());
        */
        
        return services;
    }
    
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtKey = configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey))
        {
            throw new InvalidOperationException("JWT Key is not configured. Please set Jwt:Key in configuration.");
        }
        
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = configuration["Jwt:Issuer"] ?? "e-Taca",
                ValidAudience = configuration["Jwt:Audience"] ?? "e-Taca",
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.Zero // Remove default 5 minute clock skew
            };
            
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                    {
                        context.Response.Headers.Append("Token-Expired", "true");
                    }
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    // Additional token validation logic if needed
                    return Task.CompletedTask;
                }
            };
        });
        
        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
            options.AddPolicy("OrganizationOwner", policy => policy.RequireRole("OrgOwner", "Admin"));
        });
        
        return services;
    }
    
    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                    ?? new[] { "https://e-taca.borg.tools", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002" };
                
                policy.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
                    .SetPreflightMaxAge(TimeSpan.FromSeconds(3600))
                    .WithExposedHeaders("Token-Expired", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset");
            });
        });
        
        return services;
    }
    
    public static IServiceCollection AddHealthChecks(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHealthChecks()
            .AddDbContextCheck<ETacaDbContext>("database", tags: new[] { "db", "sql", "postgres" })
            .AddNpgSql(
                configuration.GetConnectionString("Pg") ?? "",
                name: "postgres-direct",
                tags: new[] { "db", "sql" });
        
        return services;
    }
    
    public static IServiceCollection AddApiVersioningConfiguration(this IServiceCollection services)
    {
        services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new ApiVersion(1, 0);
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
            options.ApiVersionReader = ApiVersionReader.Combine(
                new QueryStringApiVersionReader("api-version"),
                new HeaderApiVersionReader("X-API-Version"),
                new MediaTypeApiVersionReader("ver"),
                new UrlSegmentApiVersionReader()
            );
        })
        .AddMvc()
        .AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });
        
        return services;
    }
}