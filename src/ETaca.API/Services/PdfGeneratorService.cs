using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ETaca.Domain.Entities;
using ETaca.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace ETaca.API.Services;

public interface IPdfGeneratorService
{
    Task<byte[]> GenerateDonationPdfAsync(Guid organizationId, Guid? goalId = null);
    Task<byte[]> GenerateOrganizationQrCodesAsync(Guid organizationId);
    string GenerateShortLink(string longUrl);
}

public class PdfGeneratorService : IPdfGeneratorService
{
    private readonly ETacaDbContext _context;
    private readonly IQrCodeService _qrCodeService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PdfGeneratorService> _logger;

    public PdfGeneratorService(
        ETacaDbContext context,
        IQrCodeService qrCodeService,
        IConfiguration configuration,
        ILogger<PdfGeneratorService> logger)
    {
        _context = context;
        _qrCodeService = qrCodeService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<byte[]> GenerateDonationPdfAsync(Guid organizationId, Guid? goalId = null)
    {
        var organization = await _context.Organizations
            .Include(o => o.Goals)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new InvalidOperationException("Organization not found");
        }

        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://e-taca.borg.tools";
        var donationUrl = goalId.HasValue 
            ? $"{baseUrl}/o/{organization.Slug}/donate/{goalId}"
            : $"{baseUrl}/o/{organization.Slug}/donate";
        
        var shortLink = GenerateShortLink(donationUrl);
        var qrCodeData = _qrCodeService.GenerateQrCode(shortLink);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                
                page.Header()
                    .Text(organization.Name)
                    .SemiBold()
                    .FontSize(20)
                    .FontColor(organization.ThemePrimary ?? "#003366");
                
                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(20);
                        
                        column.Item().Text("e-Taca - Elektroniczna Taca")
                            .FontSize(16)
                            .SemiBold();
                        
                        if (goalId.HasValue)
                        {
                            var goal = organization.Goals.FirstOrDefault(g => g.Id == goalId.Value);
                            if (goal != null)
                            {
                                column.Item().Text($"Cel: {goal.Title}")
                                    .FontSize(14);
                                
                                if (!string.IsNullOrEmpty(goal.Description))
                                {
                                    column.Item().Text(goal.Description)
                                        .FontSize(12)
                                        .FontColor(Colors.Grey.Medium);
                                }
                            }
                        }
                        
                        column.Item().AlignCenter().Column(innerColumn =>
                        {
                            innerColumn.Item().Width(200).Height(200)
                                .Image(qrCodeData);
                            
                            innerColumn.Item().PaddingTop(10)
                                .Text("Zeskanuj kod QR aby dokonać wpłaty")
                                .FontSize(12)
                                .AlignCenter();
                        });
                        
                        column.Item().Background(Colors.Grey.Lighten4)
                            .Padding(10)
                            .Column(linkColumn =>
                            {
                                linkColumn.Item().Text("Link do wpłaty:")
                                    .FontSize(10)
                                    .SemiBold();
                                
                                linkColumn.Item().Text(shortLink)
                                    .FontSize(10)
                                    .FontColor(Colors.Blue.Medium);
                            });
                        
                        column.Item().Text("Instrukcja:")
                            .FontSize(12)
                            .SemiBold();
                        
                        column.Item().Column(instructionsColumn =>
                        {
                            instructionsColumn.Item().Text("1. Zeskanuj kod QR używając aparatu telefonu")
                                .FontSize(10);
                            instructionsColumn.Item().Text("2. Wybierz kwotę wpłaty")
                                .FontSize(10);
                            instructionsColumn.Item().Text("3. Podaj swoje dane kontaktowe")
                                .FontSize(10);
                            instructionsColumn.Item().Text("4. Dokonaj bezpiecznej płatności online")
                                .FontSize(10);
                        });
                    });
                
                page.Footer()
                    .AlignCenter()
                    .Text(text =>
                    {
                        text.Span("Wygenerowano: ");
                        text.Span(DateTime.Now.ToString("yyyy-MM-dd HH:mm"));
                    });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> GenerateOrganizationQrCodesAsync(Guid organizationId)
    {
        var organization = await _context.Organizations
            .Include(o => o.Goals.Where(g => g.IsActive))
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new InvalidOperationException("Organization not found");
        }

        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://e-taca.borg.tools";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                
                page.Header()
                    .Column(column =>
                    {
                        column.Item().Text(organization.Name)
                            .SemiBold()
                            .FontSize(24)
                            .FontColor(organization.ThemePrimary ?? "#003366");
                        
                        column.Item().Text("Kody QR do wpłat e-Taca")
                            .FontSize(14)
                            .FontColor(Colors.Grey.Medium);
                    });
                
                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(15);
                        
                        // General donation QR
                        column.Item().Border(1).BorderColor(Colors.Grey.Lighten2)
                            .Padding(10)
                            .Row(row =>
                            {
                                row.RelativeItem(2).Column(textColumn =>
                                {
                                    textColumn.Item().Text("Dowolna wpłata")
                                        .FontSize(14)
                                        .SemiBold();
                                    
                                    textColumn.Item().Text("Wpłata na dowolny cel organizacji")
                                        .FontSize(10)
                                        .FontColor(Colors.Grey.Medium);
                                    
                                    var generalUrl = $"{baseUrl}/o/{organization.Slug}/donate";
                                    var generalShortLink = GenerateShortLink(generalUrl);
                                    
                                    textColumn.Item().PaddingTop(5)
                                        .Text(generalShortLink)
                                        .FontSize(9)
                                        .FontColor(Colors.Blue.Medium);
                                });
                                
                                row.ConstantItem(120).AlignRight()
                                    .Image(_qrCodeService.GenerateQrCode(
                                        $"{baseUrl}/o/{organization.Slug}/donate"));
                            });
                        
                        // Goal-specific QRs
                        foreach (var goal in organization.Goals)
                        {
                            var goalUrl = $"{baseUrl}/o/{organization.Slug}/donate/{goal.Id}";
                            var goalShortLink = GenerateShortLink(goalUrl);
                            
                            column.Item().Border(1).BorderColor(Colors.Grey.Lighten2)
                                .Padding(10)
                                .Row(row =>
                                {
                                    row.RelativeItem(2).Column(textColumn =>
                                    {
                                        textColumn.Item().Text(goal.Title)
                                            .FontSize(14)
                                            .SemiBold();
                                        
                                        if (!string.IsNullOrEmpty(goal.Description))
                                        {
                                            textColumn.Item().Text(goal.Description
                                                .Substring(0, Math.Min(goal.Description.Length, 100)))
                                                .FontSize(10)
                                                .FontColor(Colors.Grey.Medium);
                                        }
                                        
                                        if (goal.TargetAmount.HasValue)
                                        {
                                            textColumn.Item().Text($"Cel: {goal.TargetAmount:C}")
                                                .FontSize(10)
                                                .FontColor(Colors.Green.Medium);
                                        }
                                        
                                        textColumn.Item().PaddingTop(5)
                                            .Text(goalShortLink)
                                            .FontSize(9)
                                            .FontColor(Colors.Blue.Medium);
                                    });
                                    
                                    row.ConstantItem(120).AlignRight()
                                        .Image(_qrCodeService.GenerateQrCode(goalUrl));
                                });
                        }
                    });
                
                page.Footer()
                    .Column(column =>
                    {
                        column.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten2);
                        
                        column.Item().PaddingTop(5).Row(row =>
                        {
                            row.RelativeItem().Text($"NIP: {organization.Nip}")
                                .FontSize(9);
                            
                            if (!string.IsNullOrEmpty(organization.Krs))
                            {
                                row.RelativeItem().Text($"KRS: {organization.Krs}")
                                    .FontSize(9);
                            }
                            
                            row.RelativeItem().AlignRight()
                                .Text($"Wygenerowano: {DateTime.Now:yyyy-MM-dd HH:mm}")
                                .FontSize(9);
                        });
                    });
            });
        });

        return document.GeneratePdf();
    }

    public string GenerateShortLink(string longUrl)
    {
        // For MVP, we'll use a simple hash-based approach
        // In production, you'd want to store these in a database for proper URL shortening
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(longUrl));
        var shortCode = Convert.ToBase64String(hash)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "")
            .Substring(0, 8);
        
        var baseUrl = _configuration["AppSettings:ShortLinkDomain"] ?? "e-taca.borg.tools";
        return $"{baseUrl}/s/{shortCode}";
    }
}