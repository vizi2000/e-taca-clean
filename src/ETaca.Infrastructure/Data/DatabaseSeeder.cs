using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ETaca.Domain.Entities;
using ETaca.Domain.Enums;
using System.Security.Cryptography;
using System.Text;

namespace ETaca.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ETacaDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ETacaDbContext>>();

        try
        {
            // Ensure database is created and migrations are applied
            await context.Database.MigrateAsync();
            
                        // Force re-seeding to update user roles
            logger.LogInformation("Starting database seeding...");
            
            // Clear existing data to ensure clean re-seed
            if (await context.Organizations.AnyAsync())
            {
                logger.LogInformation("Clearing existing data for re-seed...");
                context.Donations.RemoveRange(await context.Donations.ToListAsync());
                context.DonationGoals.RemoveRange(await context.DonationGoals.ToListAsync());
                context.Users.RemoveRange(await context.Users.ToListAsync());
                context.Organizations.RemoveRange(await context.Organizations.ToListAsync());
                await context.SaveChangesAsync();
                logger.LogInformation("Existing data cleared successfully");
            }
            
            // Create Bazylika organization with Fiserv test credentials
            var bazylika = new Organization
            {
                Name = "Bazylika św. Wojciecha w Mikołowie",
                Slug = "bazylika-mikolow",
                Nip = "6350001234",
                Krs = "0000123456",
                BankAccount = "12345678901234567890123456",
                Email = "kontakt@bazylikamikolow.pl",
                ThemePrimary = "#1e4d8c",
                HeroImageUrl = "/images/bazylika-hero.jpg",
                Status = OrganizationStatus.Active,
                FiservStoreId = "760995999",  // Test store ID from documentation
                FiservSecret = "j}2W3P)Lwv"    // Test shared secret from documentation
            };

            // Create goals for Bazylika
            var goals = new List<DonationGoal>
            {
                new DonationGoal
                {
                    Organization = bazylika,
                    Title = "Renowacja Bazyliki",
                    Slug = "renowacja-bazyliki",
                    Description = "Konserwacja zabytków i odnowa wnętrza świątyni",
                    TargetAmount = 150000,
                    IsActive = true
                },
                new DonationGoal
                {
                    Organization = bazylika,
                    Title = "Msza Święta",
                    Slug = "msza-swieta",
                    Description = "Intencje mszalne za żywych i zmarłych parafian",
                    TargetAmount = 50000,
                    IsActive = true
                },
                new DonationGoal
                {
                    Organization = bazylika,
                    Title = "Caritas Parafialna",
                    Slug = "caritas-parafialna",
                    Description = "Pomoc najbardziej potrzebującym rodzinom z parafii",
                    TargetAmount = 40000,
                    IsActive = true
                },
                new DonationGoal
                {
                    Organization = bazylika,
                    Title = "Organy Bazylikalne",
                    Slug = "organy-bazylikalne",
                    Description = "Konserwacja zabytkowych organów z XVIII wieku",
                    TargetAmount = 80000,
                    IsActive = true
                }
            };

            // Create sample donations
            var donations = new List<Donation>();
            var random = new Random();
            
            foreach (var goal in goals)
            {
                // Generate 5-15 donations per goal
                var donationCount = random.Next(5, 15);
                for (int i = 0; i < donationCount; i++)
                {
                    var amount = random.Next(2, 100) * 10; // 20-1000 PLN in 10 PLN increments
                    donations.Add(new Donation
                    {
                        ExternalRef = $"TEST-{Guid.NewGuid().ToString()[..8]}",
                        Organization = bazylika,
                        DonationGoal = goal,
                        Amount = amount,
                        DonorEmail = $"donor{i + 1}@example.com",
                        DonorName = $"Darczyńca {i + 1}",
                        Status = DonationStatus.Paid,
                        PaidAt = DateTime.UtcNow.AddDays(-random.Next(1, 30))
                    });
                }
            }

            // Create organization owner user
            var orgOwnerUser = new User
            {
                Email = "admin@bazylikamikolow.pl",
                PasswordHash = HashPassword("Admin123!"), // In production, use proper password hashing
                Role = UserRole.OrgOwner,
                Organization = bazylika,
                IsActive = true
            };

            // Create global admin user
            var globalAdminUser = new User
            {
                Email = "admin@e-taca.pl",
                PasswordHash = HashPassword("GlobalAdmin123!"), // In production, use proper password hashing
                Role = UserRole.Admin,
                Organization = null, // Global admin has no organization
                IsActive = true
            };

            // Add all entities to context
            await context.Organizations.AddAsync(bazylika);
            await context.DonationGoals.AddRangeAsync(goals);
            await context.Donations.AddRangeAsync(donations);
            await context.Users.AddAsync(orgOwnerUser);
            await context.Users.AddAsync(globalAdminUser);

            // Save to database
            await context.SaveChangesAsync();

            logger.LogInformation($"Database seeded successfully with {goals.Count} goals, {donations.Count} donations, and 2 users (1 org owner, 1 global admin)");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding database");
            throw;
        }
    }

    private static string HashPassword(string password)
    {
        // Use BCrypt for proper password hashing
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}