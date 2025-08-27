using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;
using ETaca.Domain.Entities;

namespace ETaca.API.Services;

public interface IQrCodeService
{
    byte[] GenerateQrCode(string url, int pixelSize = 10);
    string GenerateQrCodeBase64(string url, int pixelSize = 10);
    string GetOrganizationUrl(string slug);
    string GetGoalUrl(string orgSlug, string goalSlug);
}

public class QrCodeService : IQrCodeService
{
    private readonly IConfiguration _configuration;

    public QrCodeService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public byte[] GenerateQrCode(string url, int pixelSize = 10)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        
        return qrCode.GetGraphic(pixelSize);
    }

    public string GenerateQrCodeBase64(string url, int pixelSize = 10)
    {
        var qrCodeBytes = GenerateQrCode(url, pixelSize);
        return Convert.ToBase64String(qrCodeBytes);
    }

    public string GetOrganizationUrl(string slug)
    {
        var frontendUrl = _configuration["Frontend:Origin"] ?? "https://e-taca.borg.tools";
        return $"{frontendUrl}/o/{slug}";
    }

    public string GetGoalUrl(string orgSlug, string goalSlug)
    {
        var frontendUrl = _configuration["Frontend:Origin"] ?? "https://e-taca.borg.tools";
        return $"{frontendUrl}/o/{orgSlug}/{goalSlug}";
    }

    
}