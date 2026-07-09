@echo off
REM ============================================================
REM  Ruheena's Birthday Site - fully offline launcher
REM
REM  The 3D globe uses JavaScript "ES modules", which browsers
REM  REFUSE to load when you open index.html directly (file://).
REM  That is the ONLY reason the globe ever showed the old
REM  "needs an internet connection" message - it never actually
REM  needed the internet.
REM
REM  This starts a tiny LOCAL web server on your own computer
REM  (no internet involved) and opens the site. You can turn
REM  Wi-Fi OFF and everything still works.
REM ============================================================

setlocal
set PORT=8765

echo.
echo   Starting the local server on http://localhost:%PORT%/
echo   (Keep this window open while viewing the site.)
echo.

REM Open the browser after a short delay, then start the server.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:%PORT%/index.html"

REM Prefer Python, fall back to Node's http-server via npx.
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server %PORT%
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server %PORT%
  goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
  npx --yes http-server -p %PORT% -c-1
  goto :eof
)

echo.
echo   Could not find Python or Node.js on this computer.
echo   Please install one of them, or open the folder in VS Code
echo   and use the "Live Server" extension.
echo.
pause
