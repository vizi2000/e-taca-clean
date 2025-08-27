using System.Threading.Tasks;

namespace ETaca.API.Services;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string body);
}