# PowerShell script to start the Realm of Valor mobile app
Write-Host "Starting Realm of Valor Mobile App..." -ForegroundColor Green
Write-Host ""

# Navigate to the mobile app directory
Set-Location "F:\Soulforge 09-2025\rov\apps\mobile"

# Check if we're in the right directory
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Try different start methods
Write-Host "Attempting to start Metro server..." -ForegroundColor Yellow

# Method 1: Try npx expo start
try {
    Write-Host "Trying: npx expo start --clear" -ForegroundColor Cyan
    npx expo start --clear
} catch {
    Write-Host "npx expo start failed, trying alternative..." -ForegroundColor Red
    
    # Method 2: Try pnpm start
    try {
        Write-Host "Trying: pnpm start --clear" -ForegroundColor Cyan
        pnpm start --clear
    } catch {
        Write-Host "pnpm start failed, trying workspace command..." -ForegroundColor Red
        
        # Method 3: Try from workspace root
        Set-Location "F:\Soulforge 09-2025\rov"
        Write-Host "Trying: pnpm --filter @rov/mobile start --clear" -ForegroundColor Cyan
        pnpm --filter @rov/mobile start --clear
    }
}

Write-Host ""
Write-Host "Once Metro starts, press 'w' to launch web version" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow





