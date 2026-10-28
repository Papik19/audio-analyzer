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

    private static readonly Dictionary<string, string> ContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".wav"] = "audio/wav",
        [".mp3"] = "audio/mpeg",
        [".flac"] = "audio/flac",
        [".ogg"] = "audio/ogg"
    };

    private readonly AudioAnalysisClient _client;
    private readonly AppDbContext _db;
    private readonly ILogger<AnalysesController> _logger;
    private readonly string _uploadsPath;

    public AnalysesController(
        AudioAnalysisClient client,
        AppDbContext db,
        ILogger<AnalysesController> logger,
        IWebHostEnvironment environment)
    {
        _client = client;
        _db = db;
        _logger = logger;
        _uploadsPath = Path.Combine(environment.ContentRootPath, "Uploads");
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

    [HttpGet("{id:int}/audio")]
    public async Task<IActionResult> GetAudio(int id, CancellationToken cancellationToken)
    {
        var analysis = await _db.Analyses
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (analysis is null || string.IsNullOrEmpty(analysis.StoredFileName))
        {
            return NotFound(new { error = "Nie znaleziono pliku audio dla tej analizy." });
        }

        var path = Path.Combine(_uploadsPath, analysis.StoredFileName);
        if (!System.IO.File.Exists(path))
        {
            return NotFound(new { error = "Plik audio nie istnieje na serwerze." });
        }

        var extension = Path.GetExtension(analysis.StoredFileName);
        var contentType = ContentTypes.GetValueOrDefault(extension, "application/octet-stream");

        return PhysicalFile(path, contentType, enableRangeProcessing: true);
    }

    [HttpGet("{id:int}/spectrogram")]
    public async Task<IActionResult> GetSpectrogram(
        int id,
        [FromQuery] string kind = "mel",
        CancellationToken cancellationToken = default)
    {
        if (kind is not ("mel" or "linear"))
        {
            return BadRequest(new { error = "Nieprawidłowy typ spektrogramu. Dozwolone: mel, linear." });
        }

        var analysis = await _db.Analyses
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (analysis is null || string.IsNullOrEmpty(analysis.StoredFileName))
        {
            return NotFound(new { error = "Nie znaleziono pliku audio dla tej analizy." });
        }

        var audioPath = Path.Combine(_uploadsPath, analysis.StoredFileName);
        if (!System.IO.File.Exists(audioPath))
        {
            return NotFound(new { error = "Plik audio nie istnieje na serwerze." });
        }

        var baseName = Path.GetFileNameWithoutExtension(analysis.StoredFileName);
        var imagePath = Path.Combine(_uploadsPath, $"{baseName}-{kind}.png");

        if (!System.IO.File.Exists(imagePath))
        {
            try
            {
                var image = await _client.GetSpectrogramAsync(audioPath, kind, cancellationToken);
                await System.IO.File.WriteAllBytesAsync(imagePath, image, cancellationToken);
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
                return StatusCode(504, new { error = "Generowanie spektrogramu trwało zbyt długo." });
            }
        }

        return PhysicalFile(imagePath, "image/png");
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

            var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var storedPath = Path.Combine(_uploadsPath, storedFileName);

            try
            {
                Directory.CreateDirectory(_uploadsPath);

                await using (var target = System.IO.File.Create(storedPath))
                {
                    await file.CopyToAsync(target, cancellationToken);
                }

                result.StoredFileName = storedFileName;

                _db.Analyses.Add(result);
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                DeleteStoredFiles(storedFileName);
                throw;
            }

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

        var storedFileName = analysis.StoredFileName;

        _db.Analyses.Remove(analysis);
        await _db.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrEmpty(storedFileName))
        {
            DeleteStoredFiles(storedFileName);
        }

        return NoContent();
    }

    private void DeleteStoredFiles(string storedFileName)
    {
        try
        {
            var audioPath = Path.Combine(_uploadsPath, storedFileName);
            if (System.IO.File.Exists(audioPath))
            {
                System.IO.File.Delete(audioPath);
            }

            var baseName = Path.GetFileNameWithoutExtension(storedFileName);
            foreach (var imagePath in Directory.GetFiles(_uploadsPath, $"{baseName}-*.png"))
            {
                System.IO.File.Delete(imagePath);
            }
        }
        catch (IOException ex)
        {
            _logger.LogWarning(ex, "Nie udało się usunąć plików analizy {File}.", storedFileName);
        }
    }
}