using ETaca.Domain.Shared;

namespace ETaca.Domain.Entities;

public class WebhookEvent : Entity
{
    public string ExternalRef { get; set; } = string.Empty;
    public string Provider { get; set; } = "Fiserv";
    public string PayloadHash { get; set; } = string.Empty;
    public string RawPayload { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public bool Processed { get; set; }
    public string? ProcessingError { get; set; }
}