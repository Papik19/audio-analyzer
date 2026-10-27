using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    private readonly AppDbContext _db;
    private readonly ILogger<AnalysesController> _logger;

    public AnalysesController(
        AudioAnalysisClient client,
        AppDbContext db,
        ILogger<AnalysesController> logger)
    {
        _client = client;
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<AnalysisResult>>> GetAll(CancellationToken cancellationToken)
    {
        var analyses = await _db.Analyses
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(analyses);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AnalysisResult>> GetById(int id, CancellationToken cancellationToken)
    {
        var analysis = await _db.Analyses
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (analysis is null)
        {
            return NotFound(new { error = "Nie znaleziono analizy o podanym identyfikatorze." });
        }

        return Ok(analysis);
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
            result.CreatedAt = DateTime.UtcNow;

            _db.Analyses.Add(result);
            await _db.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
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

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var analysis = await _db.Analyses.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (analysis is null)
        {
            return NotFound(new { error = "Nie znaleziono analizy o podanym identyfikatorze." });
        }

        _db.Analyses.Remove(analysis);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}