using System.Security.Cryptography;
using System.Text;
using ETaca.API.DTOs;
using ETaca.Domain.Entities;
using ETaca.Domain.Enums;
using ETaca.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ETaca.API.Services;

public interface IPaymentService
{
    Task<DonationInitiatedDto> InitiateDonationAsync(InitiateDonationDto dto);
    Task<bool> ProcessWebhookAsync(WebhookPayloadDto payload);
    string GenerateExternalRef();
    bool ValidateWebhookSignature(Dictionary<string, string> payload, string providedHash, string secret);
}

public class PaymentService : IPaymentService
{
    private readonly ETacaDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(ETacaDbContext context, IConfiguration configuration, ILogger<PaymentService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DonationInitiatedDto> InitiateDonationAsync(InitiateDonationDto dto)
    {
        _logger.LogInformation("Initiating donation for organization {OrgId}, amount {Amount}", dto.OrganizationId, dto.Amount);
        
        // Enhanced validation as per Fiserv best practices
        if (dto.Amount <= 0 || dto.Amount > 100000)
        {
            _logger.LogWarning("Invalid donation amount: {Amount}", dto.Amount);
            throw new InvalidOperationException("Amount must be between 1 and 100,000 PLN");
        }
        
        if (string.IsNullOrWhiteSpace(dto.DonorEmail) || !IsValidEmail(dto.DonorEmail))
        {
            _logger.LogWarning("Invalid donor email: {Email}", dto.DonorEmail);
            throw new InvalidOperationException("Valid donor email is required");
        }
        
        // Validate organization exists and is active
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == dto.OrganizationId && o.Status == OrganizationStatus.Active);
        
        if (organization == null)
        {
            _logger.LogWarning("Organization not found or inactive: {OrgId}", dto.OrganizationId);
            throw new InvalidOperationException("Organization not found or not active");
        }

        if (string.IsNullOrEmpty(organization.FiservStoreId) || string.IsNullOrEmpty(organization.FiservSecret))
        {
            _logger.LogError("Organization payment configuration incomplete: {OrgId}", dto.OrganizationId);
            throw new InvalidOperationException("Organization payment configuration not complete");
        }

        // Validate goal if provided
        if (dto.GoalId.HasValue)
        {
            var goalExists = await _context.DonationGoals
                .AnyAsync(g => g.Id == dto.GoalId && g.OrganizationId == dto.OrganizationId && g.IsActive);
            
            if (!goalExists)
            {
                throw new InvalidOperationException("Goal not found or not active");
            }
        }

        // Create donation record
        var externalRef = GenerateExternalRef();
        var donation = new Donation
        {
            OrganizationId = dto.OrganizationId,
            DonationGoalId = dto.GoalId,
            ExternalRef = externalRef,
            Amount = dto.Amount,
            Currency = "PLN",
            DonorEmail = dto.DonorEmail,
            DonorName = dto.DonorName,
            Status = DonationStatus.Pending,
            Consent = dto.Consent,
            UtmSource = dto.UtmSource,
            UtmMedium = dto.UtmMedium,
            UtmCampaign = dto.UtmCampaign
        };

        _context.Donations.Add(donation);
        await _context.SaveChangesAsync();

        // Generate HPP form
        var formHtml = GenerateHppForm(organization, donation);

        _logger.LogInformation("Donation initiated: {ExternalRef} for organization {OrgId}", externalRef, dto.OrganizationId);

        return new DonationInitiatedDto(externalRef, formHtml, donation.Id);
    }

    public async Task<bool> ProcessWebhookAsync(WebhookPayloadDto payload)
    {
        if (string.IsNullOrEmpty(payload.Oid))
        {
            _logger.LogWarning("Webhook received without oid");
            return false;
        }

        // Check idempotency
        var payloadJson = System.Text.Json.JsonSerializer.Serialize(payload.AllFields);
        var payloadHash = ComputePayloadHash(payloadJson);

        var existingWebhook = await _context.WebhookEvents
            .FirstOrDefaultAsync(w => w.PayloadHash == payloadHash);

        if (existingWebhook != null)
        {
            _logger.LogInformation("Webhook already processed: {PayloadHash}", payloadHash);
            return true; // Already processed
        }

        // Find donation
        var donation = await _context.Donations
            .Include(d => d.Organization)
            .FirstOrDefaultAsync(d => d.ExternalRef == payload.Oid);

        if (donation == null)
        {
            _logger.LogWarning("Donation not found for external ref: {ExternalRef}", payload.Oid);
            return false;
        }

        // Validate signature
        if (!string.IsNullOrEmpty(payload.Hash) && !string.IsNullOrEmpty(donation.Organization.FiservSecret))
        {
            if (!ValidateWebhookSignature(payload.AllFields, payload.Hash, donation.Organization.FiservSecret))
            {
                _logger.LogWarning("Invalid webhook signature for: {ExternalRef}", payload.Oid);
                return false;
            }
        }

        // Store webhook event
        var webhookEvent = new WebhookEvent
        {
            ExternalRef = payload.Oid,
            Provider = "Fiserv",
            PayloadHash = payloadHash,
            RawPayload = payloadJson,
            Processed = true
        };
        _context.WebhookEvents.Add(webhookEvent);

        // Update donation status
        var previousStatus = donation.Status;
        switch (payload.Status?.ToUpper())
        {
            case "APPROVED":
            case "SUCCESS":
                donation.Status = DonationStatus.Paid;
                donation.PaidAt = DateTime.UtcNow;
                break;
            case "DECLINED":
            case "FAILED":
                donation.Status = DonationStatus.Failed;
                break;
            case "CANCELLED":
                donation.Status = DonationStatus.Cancelled;
                break;
            default:
                _logger.LogInformation("Unknown payment status: {Status}", payload.Status);
                break;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Webhook processed: {ExternalRef} - Status changed from {OldStatus} to {NewStatus}", 
            payload.Oid, previousStatus, donation.Status);

        return true;
    }

    public string GenerateExternalRef()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var random = Random.Shared.Next(10000, 99999);
        return $"DON-{timestamp}-{random}";
    }

    public bool ValidateWebhookSignature(Dictionary<string, string> payload, string providedHash, string secret)
    {
        _logger.LogInformation("Validating webhook signature for S2S notification");
        
        // Remove hash field and sort alphabetically (per Fiserv integration rules)
        var filteredPayload = payload
            .Where(kvp => !kvp.Key.Equals("hash", StringComparison.OrdinalIgnoreCase))
            .OrderBy(kvp => kvp.Key)
            .Select(kvp => kvp.Value);

        var concatenated = string.Join("", filteredPayload);
        _logger.LogDebug("S2S webhook concatenated string: {Data}", concatenated);

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(concatenated));
        var computedHashBase64 = Convert.ToBase64String(computedHash);
        
        _logger.LogDebug("S2S computed hash: {Computed}, provided hash: {Provided}", 
            computedHashBase64, providedHash);

        var isValid = computedHashBase64 == providedHash;
        _logger.LogInformation("S2S webhook signature validation: {Result}", isValid ? "VALID" : "INVALID");
        
        return isValid;
    }

    private string GenerateHppForm(Organization organization, Donation donation)
    {
        var endpoint = _configuration["Fiserv:Endpoint"];
        var successUrl = _configuration["Fiserv:SuccessUrl"];
        var failUrl = _configuration["Fiserv:FailUrl"];
        var notifyUrl = _configuration["Fiserv:NotifyUrl"];
        // Fiserv expects txndatetime expressed in the same timezone that we pass in the "timezone" field (Europe/Warsaw).
        // Convert from UTC to Europe/Warsaw to avoid a clock-skew rejection on the gateway.
        var warsawTz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw");
        var txnDateTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, warsawTz)
                                        .ToString("yyyy:MM:dd-HH:mm:ss");

        // Select parameters included in signature (alphabetically by key), EXCLUDING transactionNotificationURL
        // and using '|' as a separator. Include hash_algorithm per Fiserv requirements.
        var signatureParams = new SortedDictionary<string, string>
        {
            { "chargetotal", donation.Amount.ToString("F2") },
            { "checkoutoption", "combinedpage" },
            { "currency", "985" }, // PLN numeric code
            { "hash_algorithm", "HMACSHA256" },
            { "oid", donation.ExternalRef },
            { "responseFailURL", failUrl! },
            { "responseSuccessURL", successUrl! },
            { "storename", organization.FiservStoreId! },
            { "timezone", "Europe/Warsaw" },
            { "txndatetime", txnDateTime },
            { "txntype", "sale" }
        };

        // Build signature input string (pipe separator per integration rules)
        var concatenated = string.Join("|", signatureParams.Values);

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(organization.FiservSecret!));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(concatenated));
        var hashBase64 = Convert.ToBase64String(hash);

        // Create form fields: signature params + transactionNotificationURL + computed hash + optional buyer fields
        var fields = new Dictionary<string, string>(signatureParams)
        {
            { "transactionNotificationURL", notifyUrl! },
            { "hash", hashBase64 }
        };

        // Add optional fields to form ONLY if they have values (per Fiserv integration rules)
        if (!string.IsNullOrWhiteSpace(donation.DonorEmail))
        {
            fields["bmail"] = donation.DonorEmail.Trim();
        }
        if (!string.IsNullOrWhiteSpace(donation.DonorName))
        {
            fields["bname"] = donation.DonorName.Trim();
        }

        var formHtml = $@"
<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to payment...</title>
    <meta charset='utf-8'>
</head>
<body>
    <form id='payment-form' action='{endpoint}' method='POST'>";

        foreach (var field in fields)
        {
            formHtml += $"\n        <input type='hidden' name='{field.Key}' value='{field.Value}' />";
        }

        formHtml += @"
    </form>
    <script>
        document.getElementById('payment-form').submit();
    </script>
</body>
</html>";

        return formHtml;
    }

    private string ComputePayloadHash(string payload)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }
    
    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email && email.Length <= 100;
        }
        catch
        {
            return false;
        }
    }
}