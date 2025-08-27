using System.Net;
using System.Net.Mail;
using System.Text;
using ETaca.Domain.Entities;
using ETaca.Domain.Enums;
using ETaca.Infrastructure.Data;
using ETaca.Application.Services;
using Microsoft.EntityFrameworkCore;

namespace ETaca.API.Services;

public interface IEmailReportService
{
    Task SendMonthlyReportAsync(Guid organizationId, DateTime month);
    Task SendMonthlyReportsForAllOrganizationsAsync(DateTime month);
}

public class EmailReportService : IEmailReportService
{
    private readonly ETacaDbContext _context;
    private readonly Application.Services.ICsvExportService _csvExportService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailReportService> _logger;

    public EmailReportService(
        ETacaDbContext context,
        Application.Services.ICsvExportService csvExportService,
        IConfiguration configuration,
        ILogger<EmailReportService> logger)
    {
        _context = context;
        _csvExportService = csvExportService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendMonthlyReportAsync(Guid organizationId, DateTime month)
    {
        var startDate = new DateTime(month.Year, month.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate = startDate.AddMonths(1);

        var organization = await _context.Organizations
            .Include(o => o.Donations)
            .ThenInclude(d => d.DonationGoal)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            _logger.LogWarning("Organization {OrgId} not found for monthly report", organizationId);
            return;
        }

        var donations = organization.Donations
            .Where(d => d.Status == DonationStatus.Paid && 
                       d.PaidAt >= startDate && 
                       d.PaidAt < endDate)
            .ToList();

        if (!donations.Any())
        {
            _logger.LogInformation("No donations for organization {OrgId} in month {Month}", 
                organizationId, month.ToString("yyyy-MM"));
            return;
        }

        var reportItems = donations
            .GroupBy(d => d.DonationGoalId)
            .Select(g => new DonationReportItem
            {
                OrganizationName = organization.Name,
                GoalTitle = g.First().DonationGoal?.Title ?? "Dowolny cel",
                DonationCount = g.Count(),
                TotalAmount = g.Sum(d => d.Amount),
                AverageAmount = g.Average(d => d.Amount),
                Period = month.ToString("yyyy-MM")
            })
            .ToList();

        var csvData = _csvExportService.ExportMonthlyReport(month, reportItems);
        
        await SendEmailWithAttachmentAsync(
            organization.Email,
            $"Raport miesięczny e-Taca - {month:MMMM yyyy}",
            GenerateEmailBody(organization.Name, month, reportItems),
            $"raport_{organization.Slug}_{month:yyyy-MM}.csv",
            csvData);

        _logger.LogInformation("Monthly report sent to organization {OrgId} for month {Month}", 
            organizationId, month.ToString("yyyy-MM"));
    }

    public async Task SendMonthlyReportsForAllOrganizationsAsync(DateTime month)
    {
        var activeOrganizations = await _context.Organizations
            .Where(o => o.Status == OrganizationStatus.Active)
            .Select(o => o.Id)
            .ToListAsync();

        foreach (var orgId in activeOrganizations)
        {
            try
            {
                await SendMonthlyReportAsync(orgId, month);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send monthly report for organization {OrgId}", orgId);
            }
        }
    }

    private string GenerateEmailBody(string organizationName, DateTime month, List<DonationReportItem> items)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"<h2>Raport miesięczny e-Taca - {month:MMMM yyyy}</h2>");
        sb.AppendLine($"<p>Szanowni Państwo,</p>");
        sb.AppendLine($"<p>Przesyłamy raport wpłat dla organizacji <strong>{organizationName}</strong> za okres {month:MMMM yyyy}.</p>");
        
        sb.AppendLine("<h3>Podsumowanie:</h3>");
        sb.AppendLine("<table border='1' cellpadding='5' cellspacing='0'>");
        sb.AppendLine("<tr><th>Cel</th><th>Liczba wpłat</th><th>Suma wpłat</th><th>Średnia wpłata</th></tr>");
        
        foreach (var item in items)
        {
            sb.AppendLine($"<tr>");
            sb.AppendLine($"<td>{item.GoalTitle}</td>");
            sb.AppendLine($"<td>{item.DonationCount}</td>");
            sb.AppendLine($"<td>{item.TotalAmount:C}</td>");
            sb.AppendLine($"<td>{item.AverageAmount:C}</td>");
            sb.AppendLine($"</tr>");
        }
        
        sb.AppendLine("</table>");
        
        var total = items.Sum(i => i.TotalAmount);
        var totalCount = items.Sum(i => i.DonationCount);
        
        sb.AppendLine($"<p><strong>Łącznie:</strong> {totalCount} wpłat na kwotę {total:C}</p>");
        sb.AppendLine($"<p>Szczegółowy raport znajduje się w załączniku CSV.</p>");
        sb.AppendLine($"<p>Z poważaniem,<br/>Zespół e-Taca</p>");
        
        return sb.ToString();
    }

    private async Task SendEmailWithAttachmentAsync(
        string to, 
        string subject, 
        string body, 
        string attachmentName, 
        byte[] attachmentData)
    {
        var smtpHost = _configuration["Email:SmtpHost"] ?? "localhost";
        var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
        var smtpUser = _configuration["Email:SmtpUser"] ?? "";
        var smtpPassword = _configuration["Email:SmtpPassword"] ?? "";
        var fromEmail = _configuration["Email:FromEmail"] ?? "noreply@etaca.pl";
        var fromName = _configuration["Email:FromName"] ?? "e-Taca";

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(smtpUser, smtpPassword)
        };

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        message.To.Add(to);

        using var ms = new MemoryStream(attachmentData);
        var attachment = new Attachment(ms, attachmentName, "text/csv");
        message.Attachments.Add(attachment);

        await client.SendMailAsync(message);
    }
}