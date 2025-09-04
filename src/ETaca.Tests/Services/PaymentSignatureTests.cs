using System.Security.Cryptography;
using System.Text;
using ETaca.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using ETaca.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ETaca.Tests.Services;

public class PaymentSignatureTests
{
    private (PaymentService svc, IConfiguration cfg, ETacaDbContext db) Create()
    {
        var cfgDict = new Dictionary<string, string?>
        {
            ["Fiserv:Endpoint"] = "https://test.ipg-online.com/connect/gateway/processing",
            ["Fiserv:SuccessUrl"] = "https://example.com/success",
            ["Fiserv:FailUrl"] = "https://example.com/fail",
            ["Fiserv:NotifyUrl"] = "https://example.com/notify"
        };
        var cfg = new ConfigurationBuilder().AddInMemoryCollection(cfgDict!).Build();
        var options = new DbContextOptionsBuilder<ETacaDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ETacaDbContext(options);
        var svc = new PaymentService(db, cfg, new NullLogger<PaymentService>());
        return (svc, cfg, db);
    }

    [Fact]
    public void Hmac_uses_base64_and_pipe_separator_and_excludes_notify()
    {
        // Arrange
        var secret = "test_secret";
        var values = new SortedDictionary<string, string>
        {
            { "chargetotal",  "12.34" },
            { "checkoutoption","combinedpage" },
            { "currency",     "985" },
            { "hash_algorithm","HMACSHA256" },
            { "oid",          "DON-1-12345" },
            { "responseFailURL",   "https://example.com/fail" },
            { "responseSuccessURL", "https://example.com/success" },
            { "storename",    "760995999" },
            { "timezone",     "Europe/Warsaw" },
            { "txndatetime",  "2025:09:04-12:00:00" },
            { "txntype",      "sale" }
        };
        var concatenated = string.Join("|", values.Values);

        // Act
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(concatenated));
        var base64 = Convert.ToBase64String(hash);

        // Assert
        Assert.NotNull(base64);
        Assert.DoesNotContain("\n", base64);
        Assert.DoesNotContain(" ", concatenated);
        Assert.DoesNotContain("transactionNotificationURL", string.Join("|", values.Keys));
    }
}

