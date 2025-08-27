using Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using ETaca.API.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ETaca.Tests.Services;

/// <summary>
/// Tests for PDF generation error handling to ensure robust service behavior.
/// </summary>
public class PdfGenerationErrorHandlingTests
{
    [Fact]
    public void PdfGeneratorService_GenerateShortLink_ShouldHandleNullUrl()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        var configurationData = new Dictionary<string, string?>
        {
            {"Frontend:BaseUrl", "https://test.com"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddScoped<IQrCodeService, QrCodeService>();
        services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();
        
        var serviceProvider = services.BuildServiceProvider();
        var pdfService = serviceProvider.GetRequiredService<IPdfGeneratorService>();
        
        // Act & Assert
        Assert.Throws<ArgumentException>(() => pdfService.GenerateShortLink(null!));
        Assert.Throws<ArgumentException>(() => pdfService.GenerateShortLink(""));
        Assert.Throws<ArgumentException>(() => pdfService.GenerateShortLink("   "));
    }
    
    [Fact]
    public void PdfGeneratorService_GenerateShortLink_ShouldHandleInvalidUrl()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        var configurationData = new Dictionary<string, string?>
        {
            {"Frontend:BaseUrl", "https://test.com"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddScoped<IQrCodeService, QrCodeService>();
        services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();
        
        var serviceProvider = services.BuildServiceProvider();
        var pdfService = serviceProvider.GetRequiredService<IPdfGeneratorService>();
        
        // Act & Assert - Should handle invalid URLs gracefully
        var result = pdfService.GenerateShortLink("not-a-valid-url");
        Assert.NotNull(result);
        Assert.Contains("e-taca.borg.tools/s/", result);
    }
    
    [Theory]
    [InlineData("https://example.com")]
    [InlineData("http://test.com")]
    [InlineData("https://very-long-domain-name-that-might-cause-issues.com/with/very/long/path/segments")]
    public void PdfGeneratorService_GenerateShortLink_ShouldHandleValidUrls(string url)
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        var configurationData = new Dictionary<string, string?>
        {
            {"Frontend:BaseUrl", "https://test.com"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddScoped<IQrCodeService, QrCodeService>();
        services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();
        
        var serviceProvider = services.BuildServiceProvider();
        var pdfService = serviceProvider.GetRequiredService<IPdfGeneratorService>();
        
        // Act
        var result = pdfService.GenerateShortLink(url);
        
        // Assert
        Assert.NotNull(result);
        Assert.Contains("e-taca.borg.tools/s/", result);
        Assert.True(result.Length > "e-taca.borg.tools/s/".Length);
    }
    
    [Fact]
    public void QrCodeService_GenerateQrCode_ShouldHandleEmptyString()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        var configurationData = new Dictionary<string, string?>
        {
            {"Frontend:BaseUrl", "https://test.com"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddScoped<IQrCodeService, QrCodeService>();
        
        var serviceProvider = services.BuildServiceProvider();
        var qrService = serviceProvider.GetRequiredService<IQrCodeService>();
        
        // Act & Assert - Should handle empty/null strings gracefully
        Assert.Throws<ArgumentException>(() => qrService.GenerateQrCode(null!));
        Assert.Throws<ArgumentException>(() => qrService.GenerateQrCode(""));
        Assert.Throws<ArgumentException>(() => qrService.GenerateQrCode("   "));
    }
    
    [Fact]
    public void QrCodeService_GetOrganizationUrl_ShouldHandleSpecialCharacters()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        var configurationData = new Dictionary<string, string?>
        {
            {"Frontend:BaseUrl", "https://test.com"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddScoped<IQrCodeService, QrCodeService>();
        
        var serviceProvider = services.BuildServiceProvider();
        var qrService = serviceProvider.GetRequiredService<IQrCodeService>();
        
        // Act
        var url1 = qrService.GetOrganizationUrl("org-with-dashes");
        var url2 = qrService.GetOrganizationUrl("org_with_underscores");
        var url3 = qrService.GetOrganizationUrl("org123");
        
        // Assert
        Assert.Contains("org-with-dashes", url1);
        Assert.Contains("org_with_underscores", url2);
        Assert.Contains("org123", url3);
        
        // All should be valid URLs
        Assert.StartsWith("https://", url1);
        Assert.StartsWith("https://", url2);
        Assert.StartsWith("https://", url3);
    }
    
    [Fact]
    public void QrCodeService_GetGoalUrl_ShouldHandleSpecialCharacters()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        var configurationData = new Dictionary<string, string?>
        {
            {"Frontend:BaseUrl", "https://test.com"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddScoped<IQrCodeService, QrCodeService>();
        
        var serviceProvider = services.BuildServiceProvider();
        var qrService = serviceProvider.GetRequiredService<IQrCodeService>();
        
        // Act
        var url = qrService.GetGoalUrl("org-slug", "goal-slug");
        
        // Assert
        Assert.Contains("org-slug", url);
        Assert.Contains("goal-slug", url);
        Assert.StartsWith("https://", url);
    }
}
