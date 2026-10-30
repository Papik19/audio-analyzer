using System.Net.Http.Headers;
using System.Text.Json;
using Backend.Models;

namespace Backend.Services;

public class AnalysisServiceException : Exception
{
    public int StatusCode { get; }

    public AnalysisServiceException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }
}

public class AudioAnalysisClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    private readonly HttpClient _httpClient;

    public AudioAnalysisClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<AnalysisResult> AnalyzeAsync(IFormFile file, CancellationToken cancellationToken)
    {
        using var content = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();
        using var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(
            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType);
        content.Add(fileContent, "file", file.FileName);

        using var response = await _httpClient.PostAsync("/analyze", content, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new AnalysisServiceException((int)response.StatusCode, ExtractDetail(body));
        }

        var result = JsonSerializer.Deserialize<AnalysisResult>(body, JsonOptions);
        return result ?? throw new AnalysisServiceException(502, "Serwis analizy zwrócił pustą odpowiedź.");
    }

    public async Task<byte[]> GetSpectrogramAsync(string filePath, string kind, CancellationToken cancellationToken)
    {
        using var content = new MultipartFormDataContent();
        await using var stream = File.OpenRead(filePath);
        using var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileContent, "file", Path.GetFileName(filePath));

        using var response = await _httpClient.PostAsync($"/spectrogram?kind={kind}", content, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new AnalysisServiceException((int)response.StatusCode, ExtractDetail(body));
        }

        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    public async Task<TimelineData> GetTimelineAsync(string filePath, CancellationToken cancellationToken)
    {
        using var content = new MultipartFormDataContent();
        await using var stream = File.OpenRead(filePath);
        using var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileContent, "file", Path.GetFileName(filePath));

        using var response = await _httpClient.PostAsync("/timeline", content, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new AnalysisServiceException((int)response.StatusCode, ExtractDetail(body));
        }

        var data = JsonSerializer.Deserialize<TimelineData>(body, JsonOptions);
        return data ?? throw new AnalysisServiceException(502, "Serwis analizy zwrócił pustą odpowiedź.");
    }

    private static string ExtractDetail(string body)
    {
        try
        {
            using var document = JsonDocument.Parse(body);
            if (document.RootElement.TryGetProperty("detail", out var detail)
                && detail.ValueKind == JsonValueKind.String)
            {
                return detail.GetString() ?? "Błąd serwisu analizy.";
            }
        }
        catch (JsonException)
        {
        }

        return "Błąd serwisu analizy.";
    }
}