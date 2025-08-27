using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace ETaca.API.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        try
        {
            var smtpHost = _configuration["Smtp:Host"];
            var smtpPort = _configuration.GetValue<int>("Smtp:Port", 587);
            var smtpUser = _configuration["Smtp:User"];
            var smtpPassword = _configuration["Smtp:Password"];
            var fromEmail = _configuration["Smtp:From"] ?? smtpUser;
            var fromName = _configuration["Smtp:FromName"] ?? "E-Taca";
            var enableSsl = _configuration.GetValue<bool>("Smtp:EnableSsl", true);

            if (string.IsNullOrEmpty(smtpHost))
            {
                _logger.LogWarning("SMTP not configured. Email would be sent to: {To}, Subject: {Subject}", to, subject);
                _logger.LogDebug("Email body: {Body}", body);
                return;
            }

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(smtpUser, smtpPassword)
            };

            var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = body.Contains("<html") || body.Contains("<!DOCTYPE")
            };
            message.To.Add(to);

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }
}