@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Node.js 20 veya daha yeni bir surum yukleyin: https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm bulunamadi. Node.js kurulumunu kontrol edin.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Gerekli paketler yukleniyor...
  call npm install --no-package-lock
  if errorlevel 1 (
    echo Paket kurulumu basarisiz oldu.
    pause
    exit /b 1
  )
)

if not exist ".env" (
  if exist ".env.example" (
    copy /y ".env.example" ".env" >nul
    echo .env dosyasi .env.example dosyasindan olusturuldu.
    echo Yapay zeka ozellikleri icin .env icindeki GEMINI_API_KEY degerini guncelleyin.
  )
)

echo DolphDictionary baslatiliyor...
echo AI loglari bu pencerede gorunecek: model, fallback nedeni ve yanit suresi.
echo AI modeli: gemini-3.5-flash-lite
echo AI fallback sirasi: gemini-3.5-flash ^> gemini-flash-latest
echo AI varsayilan timeout: 8 saniye. Degistirmek icin .env icinde GEMINI_REQUEST_TIMEOUT_MS kullanin.
for /f "delims=" %%I in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet,Wi-Fi -ErrorAction SilentlyContinue)[0].IPAddress"') do set "LAN_IP=%%I"
echo Bu bilgisayarda: http://localhost:3000
if defined LAN_IP (
  echo Diger cihazlardan baglanti: http://!LAN_IP!:3000
) else (
  echo Ag adresi bulunamadi. Bilgisayarin IPv4 adresini kontrol edin.
)
echo Diger cihazlar ayni Wi-Fi veya yerel aga bagli olmalidir.
echo Windows Guvenlik Duvari erisim sorarsa izin verin.
netsh advfirewall firewall add rule name="DolphDictionary 3000" dir=in action=allow protocol=TCP localport=3000 profile=private >nul 2>&1
if errorlevel 1 (
  echo Guvenlik Duvari izni eklenemedi. Bu dosyayi Yonetici olarak calistirip tekrar deneyin.
)
start "" "http://localhost:3000"
call npm run dev

if errorlevel 1 (
  echo Uygulama baslatilamadi.
  pause
)

endlocal
