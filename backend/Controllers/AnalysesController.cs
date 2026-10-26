using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalysesController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".wav", ".mp3", ".flac", ".ogg"
    };

    private readonly AudioAnalysisClient _client;
    private readonly ILogger<AnalysesController> _logger;

    public AnalysesController(AudioAnalysisClient client, ILogger<AnalysesController> logger)
    {
        _client = client;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<AnalysisResult>> Create(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "Nie przesłano pliku audio." });
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest(new
            {
                error = $"Nieobsługiwany format pliku: '{extension}'. Dozwolone: WAV, MP3, FLAC, OGG."
            });
        }

        try
        {
            var result = await _client.AnalyzeAsync(file, cancellationToken);
            return Ok(result);
        }
        catch (AnalysisServiceException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Serwis analizy audio jest niedostępny.");
            return StatusCode(503, new
            {
                error = "Serwis analizy audio jest niedostępny. Sprawdź, czy został uruchomiony."
            });
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new { error = "Analiza pliku trwała zbyt długo." });
        }
    }
}