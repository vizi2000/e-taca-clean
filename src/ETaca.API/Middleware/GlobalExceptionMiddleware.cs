using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace ETaca.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Log the exception
        _logger.LogError(exception, "An unhandled exception occurred. TraceId: {TraceId}", 
            context.TraceIdentifier);

        // Prepare response
        context.Response.ContentType = "application/json";
        
        var response = new ErrorResponse
        {
            TraceId = context.TraceIdentifier,
            Timestamp = DateTime.UtcNow
        };

        // Set status code and message based on exception type
        switch (exception)
        {
            case UnauthorizedAccessException:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Unauthorized access";
                response.ErrorCode = "UNAUTHORIZED";
                break;
                
            case KeyNotFoundException:
            case FileNotFoundException:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = "Resource not found";
                response.ErrorCode = "NOT_FOUND";
                break;
                
            case ArgumentNullException:
            case ArgumentOutOfRangeException:
            case ArgumentException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = "Invalid request parameters";
                response.ErrorCode = "BAD_REQUEST";
                response.Details = _environment.IsDevelopment() ? exception.Message : null;
                break;
                
            case InvalidOperationException:
                response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = "Operation not allowed";
                response.ErrorCode = "CONFLICT";
                response.Details = _environment.IsDevelopment() ? exception.Message : null;
                break;
                
            case TimeoutException:
            case TaskCanceledException:
                response.StatusCode = (int)HttpStatusCode.RequestTimeout;
                response.Message = "Request timeout";
                response.ErrorCode = "TIMEOUT";
                break;
                
            case DbUpdateConcurrencyException dbConcurrencyEx:
                response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = "The record was modified by another user";
                response.ErrorCode = "CONCURRENCY_CONFLICT";
                response.Details = _environment.IsDevelopment() ? dbConcurrencyEx.Message : null;
                break;
                
            case DbUpdateException dbEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = "Database operation failed";
                response.ErrorCode = "DATABASE_ERROR";
                
                // Check for specific database errors
                if (dbEx.InnerException?.Message.Contains("duplicate key") == true ||
                    dbEx.InnerException?.Message.Contains("unique constraint") == true)
                {
                    response.Message = "Duplicate entry found";
                    response.ErrorCode = "DUPLICATE_ENTRY";
                }
                else if (dbEx.InnerException?.Message.Contains("foreign key") == true)
                {
                    response.Message = "Related data constraint violation";
                    response.ErrorCode = "CONSTRAINT_VIOLATION";
                }
                
                response.Details = _environment.IsDevelopment() ? dbEx.InnerException?.Message : null;
                break;
                
            case NotImplementedException:
                response.StatusCode = (int)HttpStatusCode.NotImplemented;
                response.Message = "Feature not implemented";
                response.ErrorCode = "NOT_IMPLEMENTED";
                break;
                
            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = "An error occurred while processing your request";
                response.ErrorCode = "INTERNAL_ERROR";
                
                // Only show exception details in development
                if (_environment.IsDevelopment())
                {
                    response.Details = exception.ToString();
                }
                break;
        }

        context.Response.StatusCode = response.StatusCode;

        // Include validation errors if present
        if (exception.Data.Contains("ValidationErrors"))
        {
            response.ValidationErrors = exception.Data["ValidationErrors"] as Dictionary<string, string[]>;
        }

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        var json = JsonSerializer.Serialize(response, jsonOptions);
        await context.Response.WriteAsync(json);
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string ErrorCode { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string TraceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public Dictionary<string, string[]>? ValidationErrors { get; set; }
}

// Custom exception types for specific scenarios
public class BusinessRuleException : Exception
{
    public string ErrorCode { get; }
    
    public BusinessRuleException(string message, string errorCode = "BUSINESS_RULE_VIOLATION") 
        : base(message)
    {
        ErrorCode = errorCode;
    }
}

public class ValidationException : Exception
{
    public Dictionary<string, string[]> Errors { get; }
    
    public ValidationException(Dictionary<string, string[]> errors) 
        : base("Validation failed")
    {
        Errors = errors;
        Data["ValidationErrors"] = errors;
    }
}

public class ResourceNotFoundException : Exception
{
    public string ResourceType { get; }
    public object ResourceId { get; }
    
    public ResourceNotFoundException(string resourceType, object resourceId) 
        : base($"{resourceType} with id '{resourceId}' was not found")
    {
        ResourceType = resourceType;
        ResourceId = resourceId;
    }
}

public class ConflictException : Exception
{
    public string ConflictType { get; }
    
    public ConflictException(string message, string conflictType = "RESOURCE_CONFLICT") 
        : base(message)
    {
        ConflictType = conflictType;
    }
}