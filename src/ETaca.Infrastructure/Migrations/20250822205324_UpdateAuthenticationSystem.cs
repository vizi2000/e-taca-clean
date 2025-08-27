using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ETaca.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAuthenticationSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Donations",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Donations");
        }
    }
}
