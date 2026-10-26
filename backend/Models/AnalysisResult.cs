namespace Backend.Models;

public class AnalysisResult
{
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
}