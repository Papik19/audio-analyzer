namespace Backend.Models;

public class TimelineData
{
    public List<double> Beats { get; set; } = new();
    public List<double> Times { get; set; } = new();
    public List<double> RmsDb { get; set; } = new();
    public List<double> CentroidHz { get; set; } = new();
}