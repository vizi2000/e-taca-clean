using Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using ETaca.API.Services;
using System;
using System.Collections.Generic;

namespace ETaca.Tests.Services;

/// <summary>
/// Tests to prevent circular dependencies in the service layer.
/// These tests ensure that services can be properly instantiated without infinite loops.
/// </summary>
public class CircularDependencyTests
{
    [Fact]
    public void QrCodeService_ShouldNotDependOnPdfGeneratorService()
    {
        // Arrange
        var services = new ServiceCollection();
        
        // Add logging
        services.AddLogging();
        
        // Add configuration mock
        var configurationData = new Dictionary<string, string?>
        {
            {"Frontend:BaseUrl", "https://test.com"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        
        // Register QrCodeService - it should NOT depend on IPdfGeneratorService
        services.AddScoped<IQrCodeService, QrCodeService>();
        
        var serviceProvider = services.BuildServiceProvider();
        
        // Act & Assert - This should succeed without circular dependency
        var qrCodeService = serviceProvider.GetRequiredService<IQrCodeService>();
        Assert.NotNull(qrCodeService);
        
        // Test basic functionality
        var url = qrCodeService.GetOrganizationUrl("test-org");
        Assert.Contains("test-org", url);
        
        var qrCode = qrCodeService.GenerateQrCode("https://test.com");
        Assert.NotNull(qrCode);
        Assert.True(qrCode.Length > 0);
    }
    
    [Fact]
    public void PdfGeneratorService_CanDependOnQrCodeService_WithoutCircularDependency()
    {
        // Arrange
        var services = new ServiceCollection();
        
        // Add logging
        services.AddLogging();
        
        // Add configuration
        var configurationData = new Dictionary<string, string?>
        {
            {"Frontend:BaseUrl", "https://test.com"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        
        // Add QrCodeService first (no dependencies on PDF service)
        services.AddScoped<IQrCodeService, QrCodeService>();
        
        // Add PdfGeneratorService (can depend on QrCodeService)
        services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();
        
        var serviceProvider = services.BuildServiceProvider();
        
        // Act & Assert - Both services should be created without circular dependency
        var qrCodeService = serviceProvider.GetRequiredService<IQrCodeService>();
        var pdfGeneratorService = serviceProvider.GetRequiredService<IPdfGeneratorService>();
        
        Assert.NotNull(qrCodeService);
        Assert.NotNull(pdfGeneratorService);
        
        // Test that PDF service can generate short links (basic functionality)
        var shortLink = pdfGeneratorService.GenerateShortLink("https://example.com");
        Assert.NotNull(shortLink);
        Assert.Contains("e-taca.borg.tools/s/", shortLink);
    }
    
    [Fact]
    public void ServiceRegistration_ShouldNotCauseCircularDependency_WhenBuildingServiceProvider()
    {
        // Arrange
        var services = new ServiceCollection();
        
        // Add all the services that were problematic
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
        
        // Act & Assert - Building the service provider should not throw
        var serviceProvider = services.BuildServiceProvider();
        
        // Verify we can resolve both services without issues
        var qrService = serviceProvider.GetRequiredService<IQrCodeService>();
        var pdfService = serviceProvider.GetRequiredService<IPdfGeneratorService>();
        
        Assert.NotNull(qrService);
        Assert.NotNull(pdfService);
    }
    
    [Theory]
    [InlineData("test-organization")]
    [InlineData("another-org")]
    [InlineData("special-chars-123")]
    public void QrCodeService_GenerateOrganizationUrl_ShouldWork(string organizationSlug)
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
        var qrCodeService = serviceProvider.GetRequiredService<IQrCodeService>();
        
        // Act
        var url = qrCodeService.GetOrganizationUrl(organizationSlug);
        
        // Assert
        Assert.Contains(organizationSlug, url);
        Assert.StartsWith("https://", url);
    }
    
    [Fact]
    public void QrCodeService_GenerateQrCode_ShouldReturnValidPngData()
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
        var qrCodeService = serviceProvider.GetRequiredService<IQrCodeService>();
        
        // Act
        var qrCodeBytes = qrCodeService.GenerateQrCode("https://example.com");
        
        // Assert
        Assert.NotNull(qrCodeBytes);
        Assert.True(qrCodeBytes.Length > 0);
        
        // Check PNG header (first 8 bytes should be PNG signature)
        Assert.Equal(0x89, qrCodeBytes[0]); // PNG signature byte 1
        Assert.Equal(0x50, qrCodeBytes[1]); // 'P'
        Assert.Equal(0x4E, qrCodeBytes[2]); // 'N'
        Assert.Equal(0x47, qrCodeBytes[3]); // 'G'
    }
}
