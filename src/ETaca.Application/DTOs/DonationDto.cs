namespace ETaca.Application.DTOs;

public class DonationDto
{
    public int Id { get; init; }
    public int GoalId { get; init; }
    public decimal Amount { get; init; }
    public string? DonorName { get; init; }
    public DateTime DonationDate { get; init; }
}