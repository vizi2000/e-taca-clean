using Microsoft.EntityFrameworkCore;
using ETaca.Domain.Entities;

namespace ETaca.Infrastructure.Data;

public class ETacaDbContext : DbContext
{
    public ETacaDbContext(DbContextOptions<ETacaDbContext> options) : base(options)
    {
    }

    public DbSet<Organization> Organizations { get; set; } = null!;
    public DbSet<DonationGoal> DonationGoals { get; set; } = null!;
    public DbSet<Donation> Donations { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<WebhookEvent> WebhookEvents { get; set; } = null!;
    public DbSet<AuthToken> AuthTokens { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Organization configuration
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.Nip).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Nip).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Krs).HasMaxLength(10);
            entity.Property(e => e.BankAccount).IsRequired().HasMaxLength(26);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ThemePrimary).HasMaxLength(7);
            entity.Property(e => e.FiservStoreId).HasMaxLength(100);
            entity.Property(e => e.FiservSecret).HasMaxLength(500);
        });

        // DonationGoal configuration
        modelBuilder.Entity<DonationGoal>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.OrganizationId, e.Slug }).IsUnique();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.TargetAmount).HasPrecision(18, 2);
            
            entity.HasOne(e => e.Organization)
                .WithMany(o => o.Goals)
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Donation configuration
        modelBuilder.Entity<Donation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ExternalRef).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.ExternalRef).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.DonorEmail).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DonorName).HasMaxLength(200);
            entity.Property(e => e.UtmSource).HasMaxLength(50);
            entity.Property(e => e.UtmMedium).HasMaxLength(50);
            entity.Property(e => e.UtmCampaign).HasMaxLength(100);
            
            entity.HasOne(e => e.Organization)
                .WithMany(o => o.Donations)
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.DonationGoal)
                .WithMany(g => g.Donations)
                .HasForeignKey(e => e.DonationGoalId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
            
            entity.HasOne(e => e.Organization)
                .WithMany()
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // WebhookEvent configuration
        modelBuilder.Entity<WebhookEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PayloadHash).IsUnique();
            entity.HasIndex(e => e.ExternalRef);
            entity.Property(e => e.ExternalRef).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Provider).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PayloadHash).IsRequired().HasMaxLength(100);
            entity.Property(e => e.RawPayload).IsRequired();
        });

        // AuthToken configuration
        modelBuilder.Entity<AuthToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Token, e.Type }).IsUnique();
            entity.HasIndex(e => e.ExpiresAt);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(100);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}