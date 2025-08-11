@echo off
echo ====================================
echo    AstralCore Deployment Script
echo ====================================
echo.

echo Building project...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed. Please fix errors and try again.
    pause
    exit /b 1
)

echo.
echo Build successful!
echo.

echo Deploying to Netlify...
call npx netlify deploy --prod --dir dist

echo.
echo ====================================
echo    Deployment complete!
echo    Your site should be live at:
echo    https://astral-core-react.netlify.app
echo ====================================
pause