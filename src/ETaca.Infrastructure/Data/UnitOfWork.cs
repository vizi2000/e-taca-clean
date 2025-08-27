using ETaca.Domain.Entities;
using ETaca.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace ETaca.Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly ETacaDbContext _context;
    private readonly ILoggerFactory _loggerFactory;
    private IDbContextTransaction? _transaction;
    private bool _disposed;

    private IRepository<Organization>? _organizations;
    private IRepository<User>? _users;
    private IRepository<Donation>? _donations;
    private IRepository<DonationGoal>? _donationGoals;
    private IRepository<AuthToken>? _authTokens;
    private IRepository<WebhookEvent>? _webhookEvents;

    public UnitOfWork(ETacaDbContext context, ILoggerFactory loggerFactory)
    {
        _context = context;
        _loggerFactory = loggerFactory;
    }

    public IRepository<Organization> Organizations => 
        _organizations ??= new Repository<Organization>(_context, _loggerFactory.CreateLogger<Repository<Organization>>());

    public IRepository<User> Users => 
        _users ??= new Repository<User>(_context, _loggerFactory.CreateLogger<Repository<User>>());

    public IRepository<Donation> Donations => 
        _donations ??= new Repository<Donation>(_context, _loggerFactory.CreateLogger<Repository<Donation>>());

    public IRepository<DonationGoal> DonationGoals => 
        _donationGoals ??= new Repository<DonationGoal>(_context, _loggerFactory.CreateLogger<Repository<DonationGoal>>());

    public IRepository<AuthToken> AuthTokens => 
        _authTokens ??= new Repository<AuthToken>(_context, _loggerFactory.CreateLogger<Repository<AuthToken>>());

    public IRepository<WebhookEvent> WebhookEvents => 
        _webhookEvents ??= new Repository<WebhookEvent>(_context, _loggerFactory.CreateLogger<Repository<WebhookEvent>>());

    public bool HasActiveTransaction => _transaction != null;

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> SaveChangesAsyncWithResult(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            throw new InvalidOperationException("Transaction already in progress");
        }

        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null)
        {
            throw new InvalidOperationException("No transaction in progress");
        }

        try
        {
            await SaveChangesAsync(cancellationToken);
            await _transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null)
        {
            return;
        }

        try
        {
            await _transaction.RollbackAsync(cancellationToken);
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _transaction?.Dispose();
                _context.Dispose();
            }
            _disposed = true;
        }
    }
}