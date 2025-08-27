namespace ETaca.API.Templates;

public static class EmailTemplates
{
    public static (string Subject, string Body) GetPasswordResetEmail(string baseUrl, string token, string email)
    {
        var resetLink = $"{baseUrl}/reset-password?token={token}";
        
        var subject = "Resetowanie hasła - e-Taca";
        var body = $@"
Witaj,

Otrzymaliśmy prośbę o zresetowanie hasła dla konta {email}.

Kliknij poniższy link, aby ustawić nowe hasło:
{resetLink}

Link jest ważny przez 30 minut. Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.

Pozdrawiamy,
Zespół e-Taca
";
        return (subject, body);
    }

    public static (string Subject, string Body) GetInvitationEmail(string baseUrl, string token, string organizationName)
    {
        var inviteLink = $"{baseUrl}/accept-invite?token={token}";
        
        var subject = $"Zaproszenie do zarządzania organizacją {organizationName} - e-Taca";
        var body = $@"
Witaj,

Zostałeś zaproszony do zarządzania organizacją '{organizationName}' w systemie e-Taca.

Kliknij poniższy link, aby utworzyć hasło i aktywować konto:
{inviteLink}

Link jest ważny przez 7 dni.

Pozdrawiamy,
Zespół e-Taca
";
        return (subject, body);
    }
}