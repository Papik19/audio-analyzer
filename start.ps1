$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\analysis-service'; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; dotnet run --urls http://localhost:5000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "Uruchamianie serwisow (Python, backend, frontend)..."
Start-Sleep -Seconds 10
Start-Process "http://localhost:5173"