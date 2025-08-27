using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using ETaca.Domain.Entities;
using ETaca.Domain.Enums;

namespace ETaca.Application.Services;

public interface ICsvExportService
{
    byte[] ExportDonations(IEnumerable<Donation> donations);
    byte[] ExportOrganizations(IEnumerable<Organization> organizations);
    byte[] ExportMonthlyReport(DateTime month, IEnumerable<DonationReportItem> items);
}

public class CsvExportService : ICsvExportService
{
    public byte[] ExportDonations(IEnumerable<Donation> donations)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));
        
        csv.WriteRecords(donations.Select(d => new DonationCsvRecord
        {
            Id = d.Id.ToString(),
            OrganizationName = d.Organization?.Name ?? "",
            GoalTitle = d.DonationGoal?.Title ?? "Dowolny cel",
            Amount = d.Amount,
            Currency = d.Currency,
            DonorEmail = d.DonorEmail,
            DonorName = d.DonorName ?? "",
            Status = d.Status.ToString(),
            CreatedAt = d.CreatedAt.ToLocalTime(),
            PaidAt = d.PaidAt?.ToLocalTime(),
            ExternalRef = d.ExternalRef,
            UtmSource = d.UtmSource ?? "",
            UtmMedium = d.UtmMedium ?? "",
            UtmCampaign = d.UtmCampaign ?? "",
            Consent = d.Consent ? "Tak" : "Nie"
        }));
        
        writer.Flush();
        return memoryStream.ToArray();
    }
    
    public byte[] ExportOrganizations(IEnumerable<Organization> organizations)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));
        
        csv.WriteRecords(organizations.Select(o => new OrganizationCsvRecord
        {
            Id = o.Id.ToString(),
            Name = o.Name,
            Slug = o.Slug,
            NIP = o.Nip ?? "",
            KRS = o.Krs ?? "",
            Email = o.Email,
            Status = o.Status.ToString(),
            CreatedAt = o.CreatedAt.ToLocalTime(),
            BankAccount = o.BankAccount ?? "",
            HasFiservConfig = !string.IsNullOrEmpty(o.FiservStoreId)
        }));
        
        writer.Flush();
        return memoryStream.ToArray();
    }
    
    public byte[] ExportMonthlyReport(DateTime month, IEnumerable<DonationReportItem> items)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));
        
        csv.WriteRecords(items);
        
        writer.Flush();
        return memoryStream.ToArray();
    }
}

public class DonationCsvRecord
{
    public string Id { get; set; } = "";
    public string OrganizationName { get; set; } = "";
    public string GoalTitle { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "";
    public string DonorEmail { get; set; } = "";
    public string DonorName { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string ExternalRef { get; set; } = "";
    public string UtmSource { get; set; } = "";
    public string UtmMedium { get; set; } = "";
    public string UtmCampaign { get; set; } = "";
    public string Consent { get; set; } = "";
}

public class OrganizationCsvRecord
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string NIP { get; set; } = "";
    public string KRS { get; set; } = "";
    public string Email { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string BankAccount { get; set; } = "";
    public bool HasFiservConfig { get; set; }
}

public class DonationReportItem
{
    public string OrganizationName { get; set; } = "";
    public string GoalTitle { get; set; } = "";
    public int DonationCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AverageAmount { get; set; }
    public string Period { get; set; } = "";
}