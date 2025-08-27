using System.Text.Json;

namespace ETaca.API.Services;

public interface ICaptchaService
{
    Task<bool> VerifyAsync(string? token, string? ipAddress);
}

public class CaptchaService : ICaptchaService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CaptchaService> _logger;
    private readonly bool _captchaEnabled;
    private readonly string? _secretKey;

    public CaptchaService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<CaptchaService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _captchaEnabled = configuration.GetValue<bool>("Captcha:Enabled", false);
        _secretKey = configuration["Captcha:SecretKey"];
    }

    public async Task<bool> VerifyAsync(string? token, string? ipAddress)
    {
        // If captcha is disabled in configuration, always return true
        if (!_captchaEnabled)
        {
            _logger.LogDebug("Captcha verification is disabled");
            return true;
        }

        // If captcha is enabled but no token provided, fail
        if (string.IsNullOrEmpty(token))
        {
            _logger.LogWarning("Captcha token is missing");
            return false;
        }

        // If no secret key is configured, log warning but pass
        if (string.IsNullOrEmpty(_secretKey))
        {
            _logger.LogWarning("Captcha secret key is not configured");
            return true;
        }

        try
        {
            var formData = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["response"] = token,
                ["secret"] = _secretKey,
                ["remoteip"] = ipAddress ?? string.Empty
            });

            var response = await _httpClient.PostAsync("https://hcaptcha.com/siteverify", formData);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("hCaptcha API returned status code: {StatusCode}", response.StatusCode);
                return false;
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(jsonResponse);
            
            if (document.RootElement.TryGetProperty("success", out var successElement))
            {
                var success = successElement.GetBoolean();
                
                if (!success && document.RootElement.TryGetProperty("error-codes", out var errorCodes))
                {
                    var errors = errorCodes.EnumerateArray().Select(e => e.GetString()).ToList();
                    _logger.LogWarning("hCaptcha verification failed with errors: {Errors}", string.Join(", ", errors));
                }
                
                return success;
            }

            _logger.LogError("Invalid response from hCaptcha API");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying captcha token");
            // In case of error, we could decide to fail open or fail closed
            // For security, we'll fail closed (return false)
            return false;
        }
    }
}