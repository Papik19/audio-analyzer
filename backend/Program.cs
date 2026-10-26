using Backend.Services;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

const int MaxUploadBytes = 100 * 1024 * 1024; // 100 MB

builder.Services.AddControllers();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = MaxUploadBytes;
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = MaxUploadBytes;
});

var analysisServiceUrl = builder.Configuration["AnalysisService:BaseUrl"]
    ?? throw new InvalidOperationException("Brak ustawienia AnalysisService:BaseUrl w appsettings.json");

builder.Services.AddHttpClient<AudioAnalysisClient>(client =>
{
    client.BaseAddress = new Uri(analysisServiceUrl);
    client.Timeout = TimeSpan.FromMinutes(5);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("Frontend");
app.MapControllers();

app.Run();