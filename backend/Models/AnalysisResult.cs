using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class AnalysisResult
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string FileName { get; set; } = string.Empty;
    public double DurationSeconds { get; set; }
    public int SampleRate { get; set; }
    public double TempoBpm { get; set; }
    public double RmsMean { get; set; }
    public double LoudnessDb { get; set; }
    public double SpectralCentroidHz { get; set; }
    public double SpectralRolloffHz { get; set; }
    public double ZeroCrossingRate { get; set; }
    public List<double> MfccMean { get; set; } = new();
    public double ProcessingTimeSeconds { get; set; }

    [JsonIgnore]
    public string? StoredFileName { get; set; }

    [NotMapped]
    public bool HasAudio => !string.IsNullOrEmpty(StoredFileName);
}