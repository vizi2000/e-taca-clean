namespace ETaca.Application.DTOs;

public class GoalDto
{
    public int Id { get; init; }
    public string Name { get; init; } = default!;
    public string Description { get; init; } = default!;
    public decimal TargetAmount { get; init; }
    public decimal CurrentAmount { get; init; }
}