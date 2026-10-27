using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class IntialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Analyses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", nullable: false),
                    DurationSeconds = table.Column<double>(type: "REAL", nullable: false),
                    SampleRate = table.Column<int>(type: "INTEGER", nullable: false),
                    TempoBpm = table.Column<double>(type: "REAL", nullable: false),
                    RmsMean = table.Column<double>(type: "REAL", nullable: false),
                    LoudnessDb = table.Column<double>(type: "REAL", nullable: false),
                    SpectralCentroidHz = table.Column<double>(type: "REAL", nullable: false),
                    SpectralRolloffHz = table.Column<double>(type: "REAL", nullable: false),
                    ZeroCrossingRate = table.Column<double>(type: "REAL", nullable: false),
                    MfccMean = table.Column<string>(type: "TEXT", nullable: false),
                    ProcessingTimeSeconds = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Analyses", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Analyses");
        }
    }
}
