namespace ETaca.API.Services;

public static class EmailTemplates
{
    private static string BaseTemplate(string title, string content)
    {
        return $@"
<!DOCTYPE html>
<html lang='pl'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #003366;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 32px;
            font-weight: bold;
            color: #003366;
            margin-bottom: 10px;
        }}
        .tagline {{
            color: #666;
            font-size: 14px;
        }}
        .content {{
            margin: 30px 0;
        }}
        .button {{
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #999;
        }}
        .highlight {{
            background-color: #f0f8ff;
            padding: 15px;
            border-left: 4px solid #003366;
            margin: 20px 0;
        }}
        .feature-list {{
            list-style: none;
            padding: 0;
        }}
        .feature-list li {{
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
        }}
        .feature-list li:before {{
            content: '✅';
            position: absolute;
            left: 0;
        }}
        h2 {{
            color: #003366;
        }}
        .info-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        .info-table td {{
            padding: 10px;
            border-bottom: 1px solid #eee;
        }}
        .info-table td:first-child {{
            font-weight: bold;
            color: #666;
            width: 40%;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>⛪ e-Taca</div>
            <div class='tagline'>Cyfrowa taca dla Twojej parafii</div>
        </div>
        {content}
        <div class='footer'>
            <p>© 2024 e-Taca. Wszystkie prawa zastrzeżone.</p>
            <p>System zarządzania wpłatami dla organizacji religijnych i charytatywnych</p>
            <p style='margin-top: 10px; font-style: italic;'>
                Created by The Collective BORG.tools by assimilation of best technology and human assets.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    public static string OrganizationActivated(string organizationName, string panelUrl, string baseUrl = null)
    {
        var url = baseUrl ?? "https://e-taca.borg.tools";
        var content = $@"
        <h2>Gratulacje! Twoja organizacja została aktywowana</h2>
        
        <p>Szanowni Państwo,</p>
        
        <p>Z przyjemnością informujemy, że organizacja <strong>{organizationName}</strong> została pomyślnie aktywowana w systemie e-Taca.</p>
        
        <div class='highlight'>
            <strong>Co możesz teraz zrobić:</strong>
            <ul class='feature-list'>
                <li>Zarządzać celami zbiórek (maksymalnie 3 aktywne)</li>
                <li>Generować kody QR do wpłat</li>
                <li>Monitorować darowizny w czasie rzeczywistym</li>
                <li>Pobierać raporty CSV</li>
                <li>Konfigurować wygląd strony organizacji</li>
            </ul>
        </div>
        
        <div style='text-align: center;'>
            <a href='{url}/panel' class='button'>Przejdź do panelu zarządzania</a>
        </div>
        
        <p><strong>Pierwsze kroki:</strong></p>
        <ol>
            <li>Zaloguj się do panelu używając adresu email i hasła podanego podczas rejestracji</li>
            <li>Dodaj cele zbiórek (np. ""Ofiara na kościół"", ""Pomoc potrzebującym"")</li>
            <li>Wygeneruj kody QR i umieść je w widocznych miejscach</li>
            <li>Udostępnij link do strony wpłat swoim darczyńcom</li>
        </ol>
        
        <p>W razie pytań lub problemów, prosimy o kontakt z administratorem systemu.</p>
        
        <p>Z poważaniem,<br>
        Zespół e-Taca</p>";

        return BaseTemplate("Organizacja aktywowana", content);
    }

    public static string OrganizationRegistered(string organizationName, string adminEmail)
    {
        var content = $@"
        <h2>Rejestracja organizacji przyjęta</h2>
        
        <p>Dziękujemy za rejestrację organizacji <strong>{organizationName}</strong> w systemie e-Taca.</p>
        
        <div class='highlight'>
            <strong>Status rejestracji:</strong> Oczekuje na aktywację
        </div>
        
        <p>Twoje zgłoszenie zostało przekazane do administratora systemu. Aktywacja konta nastąpi po weryfikacji danych i konfiguracji systemu płatności.</p>
        
        <p><strong>Co dalej?</strong></p>
        <ul>
            <li>Administrator zweryfikuje podane dane</li>
            <li>Skonfiguruje integrację z systemem płatności Fiserv/Polcard</li>
            <li>Aktywuje Twoje konto</li>
            <li>Otrzymasz email z potwierdzeniem aktywacji</li>
        </ul>
        
        <p>Proces aktywacji zwykle trwa do 24 godzin w dni robocze.</p>
        
        <p>Jeśli masz pytania, skontaktuj się z administratorem: {adminEmail}</p>
        
        <p>Z poważaniem,<br>
        Zespół e-Taca</p>";

        return BaseTemplate("Potwierdzenie rejestracji", content);
    }

    public static string NewOrganizationForAdmin(string organizationName, string nip, string email, string contactPerson, string baseUrl = null)
    {
        var url = baseUrl ?? "https://e-taca.borg.tools";
        var content = $@"
        <h2>Nowa organizacja do aktywacji</h2>
        
        <p>W systemie e-Taca została zarejestrowana nowa organizacja wymagająca aktywacji.</p>
        
        <table class='info-table'>
            <tr>
                <td>Nazwa organizacji:</td>
                <td>{organizationName}</td>
            </tr>
            <tr>
                <td>NIP:</td>
                <td>{nip}</td>
            </tr>
            <tr>
                <td>Email:</td>
                <td>{email}</td>
            </tr>
            <tr>
                <td>Osoba kontaktowa:</td>
                <td>{contactPerson}</td>
            </tr>
            <tr>
                <td>Data rejestracji:</td>
                <td>{DateTime.Now:yyyy-MM-dd HH:mm}</td>
            </tr>
        </table>
        
        <div class='highlight'>
            <strong>Wymagane działania:</strong>
            <ol>
                <li>Zweryfikuj dane organizacji (NIP, KRS)</li>
                <li>Skonfiguruj dane Fiserv (Store ID, Secret)</li>
                <li>Aktywuj organizację w panelu administracyjnym</li>
            </ol>
        </div>
        
        <div style='text-align: center;'>
            <a href='{url}/admin' class='button'>Przejdź do panelu admina</a>
        </div>
        
        <p>Po aktywacji organizacja otrzyma automatyczny email z informacją o dostępie do systemu.</p>";

        return BaseTemplate("Nowa organizacja w systemie", content);
    }

    public static string DonationConfirmation(string donorName, decimal amount, string goalTitle, string organizationName)
    {
        var content = $@"
        <h2>Dziękujemy za Twoją darowiznę!</h2>
        
        <p>{(string.IsNullOrEmpty(donorName) ? "Drogi Darczyńco" : $"Drogi/a {donorName}")},</p>
        
        <p>Serdecznie dziękujemy za Twoje wsparcie dla <strong>{organizationName}</strong>.</p>
        
        <div class='highlight'>
            <table style='width: 100%;'>
                <tr>
                    <td><strong>Kwota darowizny:</strong></td>
                    <td style='text-align: right; font-size: 24px; color: #003366;'><strong>{amount:C}</strong></td>
                </tr>
                <tr>
                    <td><strong>Cel wpłaty:</strong></td>
                    <td style='text-align: right;'>{goalTitle}</td>
                </tr>
                <tr>
                    <td><strong>Status:</strong></td>
                    <td style='text-align: right; color: green;'>✅ Potwierdzona</td>
                </tr>
            </table>
        </div>
        
        <p>Twoja darowizna została pomyślnie przetworzona i przekazana na konto organizacji. Dzięki Twojemu wsparciu możemy kontynuować naszą misję.</p>
        
        <p><strong>Co się dzieje z Twoją darowizną?</strong></p>
        <ul>
            <li>100% wpłaconej kwoty trafia do organizacji</li>
            <li>Środki zostaną wykorzystane zgodnie z wybranym celem</li>
            <li>Organizacja otrzyma powiadomienie o Twojej wpłacie</li>
        </ul>
        
        <p style='text-align: center; margin-top: 30px;'>
            <em>""Każdy niech przeto postąpi tak, jak mu nakazuje jego własne serce, nie żałując i nie czując się przymuszonym, albowiem radosnego dawcę miłuje Bóg.""<br>
            - 2 List do Koryntian 9:7</em>
        </p>
        
        <p>Bóg zapłać za Twoje dobre serce!</p>
        
        <p>Z wyrazami szacunku,<br>
        {organizationName}</p>";

        return BaseTemplate("Potwierdzenie darowizny", content);
    }

    public static string PasswordResetRequest(string resetLink, string userName, string baseUrl = null)
    {
        var content = $@"
        <h2>Reset hasła w systemie e-Taca</h2>
        
        <p>Witaj {userName},</p>
        
        <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w systemie e-Taca.</p>
        
        <div class='highlight'>
            <strong>⚠️ Uwaga:</strong> Jeśli to nie Ty prosiłeś/aś o reset hasła, zignoruj tę wiadomość. Twoje hasło pozostanie niezmienione.
        </div>
        
        <p>Aby zresetować hasło, kliknij poniższy przycisk:</p>
        
        <div style='text-align: center;'>
            <a href='{resetLink}' class='button'>Zresetuj hasło</a>
        </div>
        
        <p style='text-align: center; color: #666; font-size: 12px;'>
            Lub skopiuj i wklej ten link do przeglądarki:<br>
            <code>{resetLink}</code>
        </p>
        
        <p><strong>Link jest ważny przez 24 godziny.</strong> Po tym czasie będziesz musiał/a ponownie poprosić o reset hasła.</p>
        
        <p>Z poważaniem,<br>
        Zespół e-Taca</p>";

        return BaseTemplate("Reset hasła", content);
    }

    public static string MonthlyReport(string organizationName, DateTime month, decimal totalAmount, int totalDonations, List<(string GoalTitle, decimal Amount, int Count)> goalStats, string baseUrl = null)
    {
        var url = baseUrl ?? "https://e-taca.borg.tools";
        var goalRows = string.Join("\n", goalStats.Select(g => $@"
            <tr>
                <td>{g.GoalTitle}</td>
                <td style='text-align: center;'>{g.Count}</td>
                <td style='text-align: right;'>{g.Amount:C}</td>
            </tr>"));

        var content = $@"
        <h2>Raport miesięczny - {month:MMMM yyyy}</h2>
        
        <p>Szanowni Państwo,</p>
        
        <p>Przedstawiamy raport wpłat dla <strong>{organizationName}</strong> za {month:MMMM yyyy}.</p>
        
        <div class='highlight' style='text-align: center;'>
            <div style='font-size: 14px; color: #666;'>Całkowita kwota wpłat</div>
            <div style='font-size: 36px; color: #003366; font-weight: bold;'>{totalAmount:C}</div>
            <div style='font-size: 14px; color: #666;'>Liczba wpłat: {totalDonations}</div>
        </div>
        
        <h3 style='color: #003366; margin-top: 30px;'>Szczegóły według celów:</h3>
        
        <table class='info-table'>
            <thead>
                <tr style='background-color: #f0f8ff;'>
                    <th style='text-align: left; padding: 10px;'>Cel</th>
                    <th style='text-align: center; padding: 10px;'>Liczba wpłat</th>
                    <th style='text-align: right; padding: 10px;'>Kwota</th>
                </tr>
            </thead>
            <tbody>
                {goalRows}
            </tbody>
            <tfoot>
                <tr style='font-weight: bold; border-top: 2px solid #003366;'>
                    <td style='padding: 10px;'>RAZEM</td>
                    <td style='text-align: center; padding: 10px;'>{totalDonations}</td>
                    <td style='text-align: right; padding: 10px;'>{totalAmount:C}</td>
                </tr>
            </tfoot>
        </table>
        
        <p style='margin-top: 30px;'><strong>Dziękujemy za korzystanie z systemu e-Taca!</strong></p>
        
        <p>Pełny raport w formacie CSV można pobrać w panelu zarządzania.</p>
        
        <div style='text-align: center; margin-top: 30px;'>
            <a href='{url}/panel' class='button'>Przejdź do panelu</a>
        </div>
        
        <p>Z poważaniem,<br>
        Zespół e-Taca</p>";

        return BaseTemplate($"Raport miesięczny - {month:MMMM yyyy}", content);
    }
}