using ETaca.Domain.Entities;
using ETaca.Infrastructure.Repositories;

namespace ETaca.Infrastructure.Data;

public interface IUnitOfWork : IDisposable
{
    IRepository<Organization> Organizations { get; }
    IRepository<User> Users { get; }
    IRepository<Donation> Donations { get; }
    IRepository<DonationGoal> DonationGoals { get; }
    IRepository<AuthToken> AuthTokens { get; }
    IRepository<WebhookEvent> WebhookEvents { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<bool> SaveChangesAsyncWithResult(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    bool HasActiveTransaction { get; }
}